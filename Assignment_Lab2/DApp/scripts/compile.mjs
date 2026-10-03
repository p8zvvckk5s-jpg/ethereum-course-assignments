import fs from 'node:fs';
import path from 'node:path';
import solc from 'solc';
const root = path.resolve(import.meta.dirname, '..');
fs.mkdirSync(path.join(root, 'artifacts'), {recursive:true});
const source = fs.readFileSync(path.join(root, 'contracts/Casino.sol'), 'utf8');
export function compile(local=false) {
  const oracle = fs.readFileSync(path.join(root, local ? 'test/MockOraclize.sol' : 'contracts/oraclizeAPI_0.4.sol'), 'utf8');
  const input = {language:'Solidity', sources:{'Casino.sol':{content:source}, 'oraclizeAPI_0.4.sol':{content:oracle}}, settings:{optimizer:{enabled:true,runs:200}, outputSelection:{'*':{'*':['abi','evm.bytecode.object','evm.deployedBytecode.object']}}}};
  const output = JSON.parse(solc.compileStandardWrapper(JSON.stringify(input)));
  const errors = (output.errors || []).filter(e=>e.severity === 'error');
  if(errors.length) throw new Error(errors.map(e=>e.formattedMessage).join('\n'));
  const c = output.contracts['Casino.sol'].Casino;
  const artifact = {contractName:'Casino',compiler:solc.version(),mode:local?'LOCAL MOCK ONLY':'ORACLIZE LIVE',abi:c.abi,bytecode:'0x'+c.evm.bytecode.object,runtimeBytes:c.evm.deployedBytecode.object.length/2};
  fs.writeFileSync(path.join(root,'artifacts',local?'Casino.local.json':'Casino.json'), JSON.stringify(artifact,null,2));
  fs.writeFileSync(path.join(root,'artifacts',local?'local-compile.json':'live-compile.json'),JSON.stringify({compiler:artifact.compiler,mode:artifact.mode,runtimeBytes:artifact.runtimeBytes,warnings:(output.errors||[]).map(e=>e.formattedMessage)},null,2));
  console.log(`${artifact.mode}: compiled; runtime ${artifact.runtimeBytes} bytes`);
  return artifact;
}
compile(false); compile(true);
