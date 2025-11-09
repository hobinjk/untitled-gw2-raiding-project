import { specs } from './roleToColor';

export default function isSwap(roleA: string, roleB: string) {
  let specA = roleA.split(' ').pop()!;
  let specB = roleB.split(' ').pop()!;
  return specs[specA] !== specs[specB];
}
