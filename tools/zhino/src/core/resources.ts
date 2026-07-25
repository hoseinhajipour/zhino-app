import { deleteEntity, getEntity, listEntities, upsertEntity } from './entities.js';

export async function listPages() {
  return listEntities('pages');
}

export async function getPage(id: string) {
  return getEntity('pages', id);
}

export async function upsertPage(body: Record<string, unknown> & { id: string }) {
  return upsertEntity('pages', body);
}

export async function deletePage(id: string) {
  return deleteEntity('pages', id);
}

export async function listServices() {
  return listEntities('services');
}

export async function getService(id: string) {
  return getEntity('services', id);
}

export async function upsertService(body: Record<string, unknown> & { id: string }) {
  return upsertEntity('services', body);
}

export async function listArticles(category?: string) {
  return listEntities('articles', category ? { category } : undefined);
}

export async function getArticle(id: string) {
  return getEntity('articles', id);
}

export async function upsertArticle(body: Record<string, unknown> & { id: string }) {
  return upsertEntity('articles', body);
}

export async function listDoctors() {
  return listEntities('doctors');
}

export async function upsertDoctor(body: Record<string, unknown> & { id: string }) {
  return upsertEntity('doctors', body);
}

export async function deleteDoctor(id: string) {
  return deleteEntity('doctors', id);
}

export async function listFaqs() {
  return listEntities('faqs');
}

export async function upsertFaq(body: Record<string, unknown> & { id: string }) {
  return upsertEntity('faqs', body);
}

export async function deleteFaq(id: string) {
  return deleteEntity('faqs', id);
}

export async function listForms() {
  return listEntities('forms');
}

export async function getForm(id: string) {
  return getEntity('forms', id);
}
