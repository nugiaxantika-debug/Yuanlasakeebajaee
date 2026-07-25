const fs = require('fs');
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

// add vip whatsapp number config
content = content.replace(/plan2ButtonText: "Berlangganan VIP",/, 'plan2ButtonText: "Berlangganan VIP",\n    plan2WhatsAppNumber: "",');

content = content.replace(/<input type="text" value=\{webConfig.plan2ButtonText\}/, `<input type="text" value={webConfig.plan2WhatsAppNumber || ""} onChange={(e) => setWebConfig({...webConfig, plan2WhatsAppNumber: e.target.value})} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500 mb-2" placeholder="Nomor WhatsApp (Cth: 628...)" />\n                    <input type="text" value={webConfig.plan2ButtonText}`);

// reject payment fix
// Find selectedPayment state and add reject states
content = content.replace(/const \[selectedPayment, setSelectedPayment\] = useState<any \| null>\(null\);/, `const [selectedPayment, setSelectedPayment] = useState<any | null>(null);\n  const [rejectingPaymentId, setRejectingPaymentId] = useState<string | null>(null);\n  const [rejectReason, setRejectReason] = useState("");`);

// Replace the reject button logic
content = content.replace(/<button \s*onClick=\{\(\) => \{\s*const reason = prompt\("Masukkan alasan penolakan:"\);\s*if \(reason !== null\) \{\s*handlePaymentAction\(selectedPayment\.txId, "reject", reason\);\s*\}\s*\}\}\s*className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-bold py-2\.5 rounded-xl transition-colors"\s*>\s*Tolak \(Reject\)\s*<\/button>/, `{rejectingPaymentId === selectedPayment.txId ? (
                       <div className="flex-1 flex flex-col gap-2">
                         <input type="text" placeholder="Alasan penolakan..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-rose-500" />
                         <div className="flex gap-2">
                           <button onClick={() => {
                             if (rejectReason) {
                               handlePaymentAction(selectedPayment.txId, "reject", rejectReason);
                               setRejectingPaymentId(null);
                               setRejectReason("");
                             } else {
                               alert("Alasan tidak boleh kosong");
                             }
                           }} className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-bold py-2 rounded-xl transition-colors text-sm">Submit</button>
                           <button onClick={() => {
                             setRejectingPaymentId(null);
                             setRejectReason("");
                           }} className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-2 rounded-xl transition-colors text-sm">Batal</button>
                         </div>
                       </div>
                     ) : (
                       <button 
                         onClick={() => setRejectingPaymentId(selectedPayment.txId)}
                         className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-bold py-2.5 rounded-xl transition-colors"
                       >
                         Tolak (Reject)
                       </button>
                     )}`);

fs.writeFileSync('src/pages/Dashboard.tsx', content);
