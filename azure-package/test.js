const targets = {6: 20.04, 12: 10.73, 18: 7.64, 24: 6.10, 36: 4.57, 48: 3.82, 60: 3.38};
const rate = 0.015833333;
function pmt(r, n, pv) { return pv * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1); }

let bestErr = Infinity; let bestParams = null; let bestFormula = null;

for(let fees = 0; fees <= 0.3; fees += 0.001) {
  for(let ins = 0; ins <= 0.02; ins += 0.0005) {
     let err1 = 0, err2 = 0, err3 = 0, err4=0;
     for(let n of [6, 12, 18, 24, 36, 48, 60]) {
        let g1 = 100 / (1 - fees);
        let emi1 = pmt(rate, n, g1) + ins * g1;
        err1 += Math.pow(emi1 - targets[n], 2);
        
        let g2 = 100 / (1 - fees - ins*n);
        let emi2 = pmt(rate, n, g2);
        err2 += Math.pow(emi2 - targets[n], 2);

        let g3 = 100 * (1 + fees);
        let emi3 = pmt(rate, n, g3) + ins * 100;
        err3 += Math.pow(emi3 - targets[n], 2);

        let g4 = 100 / (1 - fees);
        let emi4 = pmt(rate, n, g4) + ins * 100;
        err4 += Math.pow(emi4 - targets[n], 2);
     }
     if(err1 < bestErr) { bestErr = err1; bestParams={fees,ins}; bestFormula=1; }
     if(err2 < bestErr) { bestErr = err2; bestParams={fees,ins}; bestFormula=2; }
     if(err3 < bestErr) { bestErr = err3; bestParams={fees,ins}; bestFormula=3; }
     if(err4 < bestErr) { bestErr = err4; bestParams={fees,ins}; bestFormula=4; }
  }
}
console.log(bestErr, bestParams, bestFormula);
