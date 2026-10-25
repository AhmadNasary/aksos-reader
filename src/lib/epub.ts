/**
 * Importing EPUB files into the app's library.
 *
 * Each book lives in <documents>/books/<id>/ as book.epub (+ cover.<ext>).
 * Only the id is stored in AsyncStorage — on iOS the absolute documents path
 * can change between app updates, so paths are always rebuilt at runtime.
 */
import * as DocumentPicker from 'expo-document-picker';
import { Directory, File, Paths } from 'expo-file-system';
import { XMLParser } from 'fast-xml-parser';
import JSZip from 'jszip';
import type { Book } from '../types';

const xml = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  removeNSPrefix: true,
  textNodeName: '#text',
});

function booksRoot() {
  const dir = new Directory(Paths.document, 'books');
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
}

function bookDir(id: string) {
  return new Directory(booksRoot(), id);
}

export function epubFile(id: string) {
  return new File(bookDir(id), 'book.epub');
}

/** Native file path (no file:// prefix) — what ReadiumView expects. */
export function epubPath(id: string) {
  return decodeURI(epubFile(id).uri.replace(/^file:\/\//, ''));
}

export function coverUri(book: Pick<Book, 'id' | 'coverExt'>) {
  if (!book.coverExt) return undefined;
  return new File(bookDir(book.id), `cover.${book.coverExt}`).uri;
}

export function deleteBookFiles(id: string) {
  try {
    const dir = bookDir(id);
    if (dir.exists) dir.delete();
  } catch (e) {
    console.warn('deleteBookFiles', e);
  }
}

function newId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/** Let the user pick .epub files and add them. Returns the books that were added. */
export async function importFromDevice(): Promise<Book[]> {
  const res = await DocumentPicker.getDocumentAsync({
    type: ['application/epub+zip', 'application/octet-stream'],
    multiple: true,
    copyToCacheDirectory: true,
  });
  if (res.canceled) return [];
  const books: Book[] = [];
  for (const asset of res.assets) {
    books.push(await importLocalFile(asset.uri, asset.name));
  }
  return books;
}

/** Download an EPUB from a URL (e.g. the Aksos store API) and add it. */
export async function importFromUrl(url: string): Promise<Book> {
  const id = newId();
  const dir = bookDir(id);
  dir.create({ intermediates: true, idempotent: true });
  const downloaded = await File.downloadFileAsync(url, dir);
  downloaded.move(new File(dir, 'book.epub'));
  return finishImport(id);
}

export async function importLocalFile(uri: string, name?: string): Promise<Book> {
  const id = newId();
  const dir = bookDir(id);
  dir.create({ intermediates: true, idempotent: true });
  new File(uri).copy(new File(dir, 'book.epub'));
  return finishImport(id, name);
}

async function finishImport(id: string, fileName?: string): Promise<Book> {
  try {
    const meta = await readEpubMetadata(id);
    return {
      id,
      title: meta.title || stripExt(fileName) || 'Untitled',
      author: meta.author ?? '',
      language: meta.language,
      coverExt: meta.coverExt,
      addedAt: Date.now(),
      progress: 0,
      bookmarks: [],
    };
  } catch (e) {
    deleteBookFiles(id);
    throw e;
  }
}

function stripExt(name?: string) {
  return name?.replace(/\.epub$/i, '');
}

/* ------------------------------------------------------------------ */
/* EPUB parsing: container.xml → OPF → title, author, language, cover */
/* ------------------------------------------------------------------ */

type EpubMeta = { title?: string; author?: string; language?: string; coverExt?: string };

async function readEpubMetadata(id: string): Promise<EpubMeta> {
  const bytes = await epubFile(id).bytes();
  const zip = await JSZip.loadAsync(bytes);

  const containerXml = await zip.file('META-INF/container.xml')?.async('string');
  if (!containerXml) throw new Error('Not an EPUB: META-INF/container.xml missing');
  const container = xml.parse(containerXml);
  const rootfile = first(container?.container?.rootfiles?.rootfile);
  const opfPath: string | undefined = rootfile?.['@_full-path'];
  if (!opfPath) throw new Error('Not an EPUB: no rootfile');

  const opfXml = await zip.file(opfPath)?.async('string');
  if (!opfXml) throw new Error('Not an EPUB: OPF missing');
  const pkg = xml.parse(opfXml)?.package ?? {};
  const md = pkg.metadata ?? {};

  const meta: EpubMeta = {
    title: text(first(md.title)),
    author: list(md.creator).map(text).filter(Boolean).join('، ') || undefined,
    language: text(first(md.language)),
  };

  // Cover: EPUB3 properties="cover-image", else EPUB2 <meta name="cover" content="id">
  const items = list(pkg.manifest?.item);
  let cover = items.find((i) => String(i['@_properties'] ?? '').split(/\s+/).includes('cover-image'));
  if (!cover) {
    const coverId = list(md.meta).find((m) => m['@_name'] === 'cover')?.['@_content'];
    if (coverId) cover = items.find((i) => i['@_id'] === coverId);
  }
  if (!cover) {
    cover = items.find(
      (i) => /^image\//.test(i['@_media-type'] ?? '') && /cover/i.test(`${i['@_id']} ${i['@_href']}`)
    );
  }

  if (cover?.['@_href']) {
    const coverPath = resolvePath(opfPath, decodeURIComponent(cover['@_href']));
    const data = await zip.file(coverPath)?.async('uint8array');
    if (data) {
      const ext = extFromMime(cover['@_media-type']) ?? coverPath.split('.').pop()?.toLowerCase() ?? 'jpg';
      const out = new File(bookDir(id), `cover.${ext}`);
      if (out.exists) out.delete();
      out.create();
      out.write(data);
      meta.coverExt = ext;
    }
  }

  return meta;
}

function first<T>(v: T | T[] | undefined): T | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function list<T = any>(v: T | T[] | undefined): T[] {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

function text(v: any): string | undefined {
  if (v == null) return undefined;
  if (typeof v === 'string' || typeof v === 'number') return String(v).trim();
  if (typeof v === 'object' && '#text' in v) return String(v['#text']).trim();
  return undefined;
}

/** Resolve an href relative to the OPF's folder inside the zip. */
function resolvePath(base: string, href: string) {
  const parts = base.split('/').slice(0, -1);
  for (const seg of href.split('/')) {
    if (seg === '..') parts.pop();
    else if (seg !== '.' && seg !== '') parts.push(seg);
  }
  return parts.join('/');
}

function extFromMime(mime?: string) {
  switch (mime) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/gif':
      return 'gif';
    default:
      return undefined;
  }
}
