import fs from 'node:fs';import ganache from 'ganache';import {JsonRpcProvider,ContractFactory,parseEther} from 'ethers';import {serve} from './serve.mjs';
const server=ganache.server({logging:{quiet:true},chain:{chainId:31337},wallet:{totalAccounts:105,defaultBalance:100}});
await server.listen(8547,'127.0.0.1');
const provider=new JsonRpcProvider('http://127.0.0.1:8547');provider.pollingInterval=10;
const a=JSON.parse(fs.readFileSync('artifacts/Casino.local.json'));
const c=await new ContractFactory(a.abi,a.bytecode,await provider.getSigner(0)).deploy(parseEther('0.001'),100);await c.waitForDeployment();
console.log('Preparing 99 local bets. Test balances only.');
for(let i=0;i<99;i++){await(await c.connect(await provider.getSigner(i)).bet(i%10+1,{value:parseEther('0.001'),gasLimit:350000})).wait();}
serve({chainId:31337,mode:'local-mock',address:await c.getAddress()});
console.log('Local demonstration ready. Public network deployment: NOT performed.');
