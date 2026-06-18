/**
 * Biblioteca de imagens pré-pronta para drinks clássicos.
 * Fonte: Unsplash (licença gratuita para uso em produto).
 *
 * Matching é feito por substring case-insensitive no nome do produto.
 * Ex: "Caipirinha de Morango" → match em "caipirinha"
 */
export const DRINK_IMAGE_LIBRARY: { termo: string; url: string }[] = [
  { termo: "caipirinha",    url: "https://images.unsplash.com/photo-1612476259373-6f2f39c62d6e?w=400&q=80" },
  { termo: "gin",           url: "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=400&q=80" },
  { termo: "negroni",       url: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80" },
  { termo: "aperol",        url: "https://images.unsplash.com/photo-1570197571499-166b36435e9f?w=400&q=80" },
  { termo: "mojito",        url: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&q=80" },
  { termo: "martini",       url: "https://images.unsplash.com/photo-1567696911980-2eed69a46042?w=400&q=80" },
  { termo: "cosmopolitan",  url: "https://images.unsplash.com/photo-1605270012917-bf5b0ee22c79?w=400&q=80" },
  { termo: "whisky sour",   url: "https://images.unsplash.com/photo-1621873495884-845a939892d4?w=400&q=80" },
  { termo: "whisky",        url: "https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=400&q=80" },
  { termo: "margarita",     url: "https://images.unsplash.com/photo-1560963805-6c64417bd2f4?w=400&q=80" },
  { termo: "daiquiri",      url: "https://images.unsplash.com/photo-1587223962930-cb7f31384c19?w=400&q=80" },
  { termo: "manhattan",     url: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&q=80" },
  { termo: "old fashioned", url: "https://images.unsplash.com/photo-1546171753-97d7676e4602?w=400&q=80" },
  { termo: "spritz",        url: "https://images.unsplash.com/photo-1570197571499-166b36435e9f?w=400&q=80" },
  { termo: "chopp",         url: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&q=80" },
  { termo: "cerveja",       url: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&q=80" },
  { termo: "heineken",      url: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&q=80" },
  { termo: "corona",        url: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&q=80" },
  { termo: "stella",        url: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&q=80" },
  { termo: "vinho tinto",   url: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&q=80" },
  { termo: "vinho branco",  url: "https://images.unsplash.com/photo-1474722883778-792e7990302f?w=400&q=80" },
  { termo: "espumante",     url: "https://images.unsplash.com/photo-1608720843869-b2b9c0da0c5a?w=400&q=80" },
  { termo: "champagne",     url: "https://images.unsplash.com/photo-1608720843869-b2b9c0da0c5a?w=400&q=80" },
  { termo: "rosé",          url: "https://images.unsplash.com/photo-1474722883778-792e7990302f?w=400&q=80" },
  { termo: "rum",           url: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&q=80" },
  { termo: "vodka",         url: "https://images.unsplash.com/photo-1565891741441-64926e441838?w=400&q=80" },
  { termo: "tequila",       url: "https://images.unsplash.com/photo-1605270012917-bf5b0ee22c79?w=400&q=80" },
  { termo: "cachaça",       url: "https://images.unsplash.com/photo-1612476259373-6f2f39c62d6e?w=400&q=80" },
  { termo: "batata",        url: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&q=80" },
  { termo: "onion",         url: "https://images.unsplash.com/photo-1639024471283-03518883512d?w=400&q=80" },
  { termo: "bruschetta",    url: "https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=400&q=80" },
  { termo: "tábua",         url: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80" },
  { termo: "croquete",      url: "https://images.unsplash.com/photo-1506280754576-f6fa8a873550?w=400&q=80" },
  { termo: "limonada",      url: "https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400&q=80" },
  { termo: "suco",          url: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&q=80" },
  { termo: "água",          url: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&q=80" },
  { termo: "refrigerante",  url: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80" },
  { termo: "café",          url: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80" },
];

/** Retorna a URL da imagem para um nome de produto, ou null se não encontrar. */
export function getImagemAutomatica(nomeProduto: string): string | null {
  const nome = nomeProduto.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  for (const { termo, url } of DRINK_IMAGE_LIBRARY) {
    const termoNorm = termo.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    if (nome.includes(termoNorm)) return url;
  }
  return null;
}
