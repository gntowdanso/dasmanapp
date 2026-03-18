(async () => {
  const pdfjsLib = await import('pdfjs-dist');
  const loadingTask = pdfjsLib.getDocument('./public/mandateform/Digital DD Form.pdf');
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(1);
  const textContent = await page.getTextContent();
  let str = '';
  textContent.items.forEach(item => {
    str += item.str + '\n';
  });
  console.log(str);
})();