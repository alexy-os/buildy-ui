import { ComponentMapper } from '../utils/componentMapper';

async function main() {
  const mapper = new ComponentMapper();
  await mapper.generateComponentMap();
}

main().catch(console.error); 