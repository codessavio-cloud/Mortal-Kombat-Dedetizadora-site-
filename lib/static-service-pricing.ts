export type DualPriceRow = {
  label: string
  cartao: number
  vista: number
}

export type TimedPriceRow = {
  label: string
  valor: number
  tempo: string
}

export type VehiclePriceRow = {
  quantidade: string
  esgoto: number
  baratinhas: number
  desconto: string
}

export type CupimPriceRow = {
  label: string
  cartao: number
  vista: number
  tempo: string
}

export const ANO_CAIXA_DAGUA = 2026

export const PRECOS_CAIXA_DAGUA_COM_DEDETIZACAO: DualPriceRow[] = [
  { label: "500lts até 1.500lts", cartao: 280, vista: 260 },
  { label: "2.000lts até 5.000lts", cartao: 390, vista: 370 },
  { label: "6.000lts até 10.000lts", cartao: 530, vista: 510 },
  { label: "11.000lts até 15.000lts", cartao: 650, vista: 630 },
  { label: "16.000lts até 20.000lts", cartao: 710, vista: 690 },
  { label: "21.000lts até 30.000lts", cartao: 840, vista: 820 },
  { label: "31.000lts até 40.000lts", cartao: 950, vista: 930 },
  { label: "41.000lts até 50.000lts", cartao: 1010, vista: 990 },
]

export const PRECOS_CAIXA_DAGUA_SEM_DEDETIZACAO: DualPriceRow[] = [
  { label: "500lts até 1.500lts", cartao: 320, vista: 300 },
  { label: "2.000lts até 5.000lts", cartao: 420, vista: 400 },
  { label: "6.000lts até 10.000lts", cartao: 580, vista: 560 },
  { label: "11.000lts até 15.000lts", cartao: 690, vista: 670 },
  { label: "16.000lts até 20.000lts", cartao: 800, vista: 780 },
]

export const PRECOS_VEICULOS: VehiclePriceRow[] = [
  { quantidade: "Se for até dois veículos", esgoto: 126, baratinhas: 231, desconto: "não tem" },
  { quantidade: "De 3 a 5 veículos", esgoto: 115.5, baratinhas: 210, desconto: "" },
  { quantidade: "De 5 a 15 veículos", esgoto: 94.5, baratinhas: 168, desconto: "a vista 5%" },
  { quantidade: "De 15 a 25 veículos", esgoto: 84, baratinhas: 157.5, desconto: "" },
  { quantidade: "De 25 a 40 veículos", esgoto: 63, baratinhas: 105, desconto: "" },
]

export const PRECOS_ATOMIZACAO_1_FUNCIONARIO: TimedPriceRow[] = [
  { label: "1 a 3 Palmeiras", valor: 189, tempo: "1 hora" },
  { label: "4 a 5 Palmeiras", valor: 273, tempo: "1h30" },
  { label: "6 a 8 Palmeiras", valor: 336, tempo: "2 horas" },
  { label: "9 a 12 Palmeiras", valor: 399, tempo: "2 horas" },
  { label: "12 a 15 Palmeiras", valor: 472.5, tempo: "2h30" },
]

export const PRECOS_ATOMIZACAO_2_FUNCIONARIOS: TimedPriceRow[] = [
  { label: "1 a 3 Palmeiras", valor: 273, tempo: "1 hora" },
  { label: "4 a 5 Palmeiras", valor: 336, tempo: "1h30" },
  { label: "6 a 8 Palmeiras", valor: 441, tempo: "2 horas" },
  { label: "9 a 12 Palmeiras", valor: 567, tempo: "2 horas" },
  { label: "12 a 15 Palmeiras", valor: 1008, tempo: "2h30" },
]

export const PRECOS_CUPIM_PORTAS: CupimPriceRow[] = [
  { label: "Até 3 portas", cartao: 315, vista: 294, tempo: "1h" },
  { label: "4 a 6 portas", cartao: 472.5, vista: 441, tempo: "1h30" },
  { label: "7 a 9 portas", cartao: 619.5, vista: 588, tempo: "2h" },
]

export const PRECO_CUPIM_SOFA = {
  descricao: "1 sofá de 3 lugares + 1 de 2 lugares",
  valor: 294,
  tempo: "1h",
  funcionarios: "1 funcionário",
}

export const PRECOS_CUPIM_GUARDA_ROUPAS: CupimPriceRow[] = [
  { label: "01 a 04 portas", cartao: 315, vista: 294, tempo: "1h" },
  { label: "05 a 08 portas", cartao: 472.5, vista: 441, tempo: "1h30" },
  { label: "09 a 12 portas", cartao: 630, vista: 588, tempo: "2h" },
]

export const GARANTIA_CUPIM = "Garantia de 3 meses"
export const TAXA_MINIMA_REAGENDAMENTO = 52.5
export const VALOR_APROXIMADO_CUPIM_SUBTERRANEO = 3150
