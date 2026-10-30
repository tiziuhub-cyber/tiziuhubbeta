// ===== CATÁLOGO DE PRODUTOS =====
// Para adicionar um jogo, copie um bloco abaixo e altere os campos.
// price = preço ORIGINAL; discount = % de desconto (0 = sem desconto).
// bestSeller: true aparece em "Mais vendidos". available: false desativa a compra.
// Categorias disponíveis. O campo "category" de cada produto deve ser IGUAL a um destes nomes.
window.CATEGORIES = [
  { name: "Esportes",   icon: "⚽" },
  { name: "Ação",       icon: "🔫" },
  { name: "Terror",     icon: "👻" },
  { name: "Corrida",    icon: "🏎️" },
  { name: "RPG",        icon: "⚔️" },
  { name: "Tiro",       icon: "🎯" },
  { name: "Estratégia", icon: "🧠" },
  { name: "Aventura",   icon: "🗺️" },
  { name: "Simulação",  icon: "🏗️" },
  { name: "Luta",       icon: "🥊" }
];

window.PRODUCTS = [
  {
    id: 1,
    name: "FC 21 - TIZIUHUB",
    image: "assets/fifa21.jpg",
    description: "Futebol para PC com ativação rápida. Entrega digital.",
    price: 22.90,
    discount: 0,
    category: "Esportes",
    checkoutUrl: "https://pay.cakto.com.br/mhgjioi_1249855",
    available: true,
    bestSeller: true
  },
  {
    id: 2,
    name: "COD BLACK OPS III",
    image: "assets/cod-bo3.jpg",
    description: "Jogo de tiro em primeira pessoa para PC.",
    price: 20.50,
    discount: 0,
    category: "Tiro",
    checkoutUrl: "https://pay.cakto.com.br/vm7b6f3_1250180",
    available: true,
    bestSeller: false
  },
  {
    id: 3,
    name: "Assassin's Creed Odyssey GOLD",
    image: "assets/aco-odyssey.jpg",
    description: "Jogo de aventura para PC.",
    price: 25.50,
    discount: 0,
    category: "Aventura",
    checkoutUrl: "https://pay.cakto.com.br/hina3a5_1252347",
    available: true,
    bestSeller: false
  },
  {
    id: 4,
    name: "Battlefield 4",
    image: "assets/battlefield-4.jpg",
    description: "Jogo de tiro para PC.",
    price: 20.90,
    discount: 0,
    category: "Tiro",
    checkoutUrl: "https://pay.cakto.com.br/hdavsgt_1252429",
    available: true,
    bestSeller: false
  },
  {
    id: 5,
    name: "Dragon Ball FighterZ",
    image: "assets/dragon-ball-fighterz.jpg",
    description: "Jogo de luta para PC.",
    price: 25.50,
    discount: 0,
    category: "Luta",
    checkoutUrl: "https://pay.cakto.com.br/3cp8thv_1255352",
    available: true,
    bestSeller: false
  },
  {
    id: 6,
    name: "Lego Marvel Avengers",
    image: "assets/lego-marvel-avengers.jpg",
    description: "Jogo de aventura para PC.",
    price: 20.50,
    discount: 0,
    category: "Aventura",
    checkoutUrl: "https://pay.cakto.com.br/3fzt7sc_1255400",
    available: true,
    bestSeller: false
  },
  {
    id: 7,
    name: "Dead Island 2",
    image: "assets/dead-island-2.jpg",
    description: "Jogo de terror para PC.",
    price: 20.50,
    discount: 0,
    category: "Terror",
    checkoutUrl: "https://pay.cakto.com.br/x6onngi_1255432",
    available: true,
    bestSeller: false
  },
  {
    id: 8,
    name: "Forza Horizon 5",
    image: "assets/forza-horizon-5.jpg",
    description: "Jogo de corrida para PC.",
    price: 29.90,
    discount: 0,
    category: "Corrida",
    checkoutUrl: "https://pay.cakto.com.br/8kgx9o8_1255471",
    available: true,
    bestSeller: false
  },
  {
    id: 9,
    name: "PES 2021 - Konami",
    image: "assets/pes-2021.jpg",
    description: "Jogo de esportes para PC.",
    price: 25.50,
    discount: 0,
    category: "Esportes",
    checkoutUrl: "https://pay.cakto.com.br/v8r8adm_1255494",
    available: true,
    bestSeller: false
  },
  {
    id: 10,
    name: "Far Cry 3",
    image: "assets/far-cry-3.jpg",
    description: "Jogo de ação para PC.",
    price: 22.50,
    discount: 0,
    category: "Ação",
    checkoutUrl: "https://pay.cakto.com.br/ohnyxhh_1255516",
    available: true,
    bestSeller: false
  },
  {
    id: 11,
    name: "Left 4 Dead 2",
    image: "assets/left-4-dead-2.jpg",
    description: "Jogo de terror para PC.",
    price: 22.50,
    discount: 0,
    category: "Terror",
    checkoutUrl: "https://pay.cakto.com.br/kj4fxoj_1255528",
    available: true,
    bestSeller: false
  }
];
