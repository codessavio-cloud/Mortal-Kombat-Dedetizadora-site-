export interface PestData {
  id: string
  name: string
  image: string
  description: string
  isSpecial?: boolean
}

export const pestData: Record<string, PestData> = {
  lei: {
    id: "lei",
    name: "Lei 25.154/2025",
    image: "/placeholder.svg",
    description: "Dedetização mensal obrigatória por lei",
    isSpecial: true,
  },
  baratinha: {
    id: "baratinha",
    name: "Baratinha",
    image: "/images/pests/baratinha-illustration.jpg",
    description: "Controle de baratas pequenas (alemãs)",
  },
  "barata-esgoto": {
    id: "barata-esgoto",
    name: "Barata de Esgoto",
    image: "/images/pests/barata-esgoto-illustration.jpg",
    description: "Controle de baratas grandes",
  },
  "aranha-mosquito-traca": {
    id: "aranha-mosquito-traca",
    name: "Aranha, Mosquito e Piolho de Pombos",
    image: "/images/pests/aranha-mosquito-traca-illustration.jpg",
    description: "Controle de aranhas, mosquitos e piolho de pássaros",
  },
  "pulga-carrapato-percevejo": {
    id: "pulga-carrapato-percevejo",
    name: "Pulga, Carrapato e Percevejo",
    image: "/images/pests/pulga-carrapato-percevejo-illustration.jpg",
    description: "Controle de pulgas, carrapatos e percevejos de cama",
  },
  cupim: {
    id: "cupim",
    name: "Cupim",
    image: "/images/pests/cupim-illustration.jpg",
    description: "Controle de cupins",
  },
  escorpiao: {
    id: "escorpiao",
    name: "Escorpião",
    image: "/images/pests/escorpiao-illustration.jpg",
    description: "Controle de escorpiões",
  },
  formiga: {
    id: "formiga",
    name: "Formiga",
    image: "/images/pests/formiga-illustration.jpg",
    description: "Controle de formigas",
  },
  "escorpiao-formiga": {
    id: "escorpiao-formiga",
    name: "Escorpião + Formiga",
    image: "/images/pests/escorpiao-formiga-illustration.jpg",
    description: "Controle combinado de escorpiões e formigas",
  },
  rato: {
    id: "rato",
    name: "Rato",
    image: "/images/pests/rato-illustration.jpg",
    description: "Controle de ratos",
  },
}
