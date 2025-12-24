import * as bcrypt from 'bcrypt';

async function main() {
  const senha = 'super123';
  const hash = await bcrypt.hash(senha, 10);
  console.log('Hash para super123:');
  console.log(hash);
}

main();
