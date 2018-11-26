const from_api_mapping = {
  'feedly-hill-finance-regulation': 'The Hill: Finance Regulation',
  'feedly-americanbanker': 'American Banker',
  'feedly-hill-finance-policy': 'The Hill: Finance Policy',
  'feedly-economist-business-finance': 'The Economist: Finance and Economics'
};

export function publication_to_spider(spider) {
  return from_api_mapping[spider] || "Mainstream News";
}
