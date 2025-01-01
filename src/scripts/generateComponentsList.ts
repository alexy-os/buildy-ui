import { ComponentList } from '../utils/componentList';

async function main() {
  const list = new ComponentList();
  await list.generateComponentList();
}

main().catch(console.error); 