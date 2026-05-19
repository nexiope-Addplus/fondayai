export const onRequest: PagesFunction = async ({ request }) => {
  const url = new URL(request.url);
  const target = new URL("/api/admin/stats", url.origin);
  target.search = url.search;

  return Response.redirect(target.toString(), 302);
};
