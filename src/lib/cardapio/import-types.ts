export function normalizarNome(nome: string): string {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export interface ProdutoPreview {
  nome: string;
  categoria: string | null;
  preco_venda: number | null;
  custo: number | null;
  descricao: string | null;
}

export interface ProdutoSalvo {
  id: string;
  nome: string;
  temCusto: boolean;
}

export interface ImportarResponse {
  produtos: ProdutoPreview[];
  colunasNaoReconhecidas: string[];
}
