document.addEventListener('DOMContentLoaded', () => {
    // Configura o worker para o pdf.js
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js`;

    // Elementos do DOM
    const gerarBtn = document.getElementById('gerarBtn');
    const imprimirBtn = document.getElementById('imprimirBtn');
    const reciboContainer = document.getElementById('reciboContainer');
    const dropArea = document.getElementById('drop-area');
    const dropAreaText = document.getElementById('drop-area-text');
    const fileElem = document.getElementById('fileElem');
    const loadingSpinner = document.getElementById('loading-spinner');
    const comprovanteAnexadoContainer = document.getElementById('comprovanteAnexadoContainer');
    const imagemComprovante = document.getElementById('imagemComprovante');

    // --- LÓGICA DE UPLOAD ---
    const preventDefaults = e => { e.preventDefault(); e.stopPropagation(); };
    const highlight = () => dropArea.classList.add('highlight');
    const unhighlight = () => dropArea.classList.remove('highlight');

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(e => dropArea.addEventListener(e, preventDefaults, false));
    ['dragenter', 'dragover'].forEach(e => dropArea.addEventListener(e, highlight, false));
    ['dragleave', 'drop'].forEach(e => dropArea.addEventListener(e, unhighlight, false));

    dropArea.addEventListener('drop', e => handleFile(e.dataTransfer.files[0]), false);
    dropArea.addEventListener('click', () => fileElem.click());
    fileElem.addEventListener('change', function() { handleFile(this.files[0]); });
    document.addEventListener('paste', e => {
        const file = e.clipboardData.files[0];
        if (file) handleFile(file);
    });

    function handleFile(file) {
        if (!file) return;
        setProcessingFeedback();
        if (file.type === "application/pdf") {
            handlePdfFile(file);
        } else if (file.type.startsWith("image/")) {
            handleImageFile(file);
        } else {
            alert("Tipo de arquivo não suportado. Por favor, use PDF ou uma imagem.");
            resetDropArea();
        }
    }

    async function handleImageFile(file) {
        const reader = new FileReader();
        reader.onload = e => imagemComprovante.src = e.target.result;
        reader.readAsDataURL(file);
        comprovanteAnexadoContainer.classList.remove('hidden');

        try {
            const worker = await Tesseract.createWorker('por');
            const { data: { text } } = await worker.recognize(file);
            await worker.terminate();
            parseTextAndFillForm(text);
            setSuccessFeedback('Imagem lida com sucesso!');
        } catch (error) {
            console.error('Erro no OCR:', error);
            setErrorFeedback('Erro ao ler a imagem.');
        }
    }

    async function handlePdfFile(file) {
        comprovanteAnexadoContainer.classList.add('hidden'); 
        const reader = new FileReader();
        reader.onload = async function() {
            try {
                const pdf = await pdfjsLib.getDocument({ data: this.result }).promise;
                let fullText = '';
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    fullText += textContent.items.map(item => item.str).join('\n');
                }
                parseTextAndFillForm(fullText);
                setSuccessFeedback('PDF lido com sucesso!');
            } catch (error) {
                console.error('Erro ao ler PDF:', error);
                setErrorFeedback('Erro ao processar o PDF.');
            }
        };
        reader.readAsArrayBuffer(file);
    }
    
    /**
     * ATUALIZADO: Versão final com Regex flexíveis para PDF e Imagem/OCR.
     */
    function parseTextAndFillForm(text) {
        console.log("Texto para análise:", text);

        // Função auxiliar para extrair e limpar os dados
        const extractData = (regex, sourceText = text) => {
            const match = sourceText.match(regex);
            return match ? match[1].trim() : '';
        };

        // --- EXPRESSÕES REGULARES UNIVERSAIS ---

        const valorRegex = /R\$\s*([\d.,]+)/;
        const recebedorNomeRegex = /Recebedor\n(.+)/;
        // Procura por um CNPJ depois da palavra "Recebedor", não importando o que há no meio
        const recebedorCnpjRegex = /Recebedor(?:.|\n)*?CNPJ\n([\d.\/\\-]+)/;
        const pagadorNomeRegex = /Pagador\n(.+)/;
        // Procura por um CNPJ depois da palavra "Pagador" e aceita erros de OCR
        const pagadorCnpjRegex = /Pagador(?:.|\n)*?CNPJ\n([\d.,\/-]+)/;
        const agenciaRegex = /Agência\n([\d-]+)/;
        const contaRegex = /Conta\n([\d-]+)/;
        const devedorRegex = /Devedor:\s*(.+)/;
        const instPagadorRegex = /Pagador(?:.|\n)*?Instituição\n([\s\S]*?BCO DO BRASIL S\.A)/;


        // --- Preenche o formulário ---
        document.getElementById('valor').value = extractData(valorRegex);
        document.getElementById('nomeRecebedor').value = extractData(recebedorNomeRegex);
        document.getElementById('cnpjRecebedor').value = extractData(recebedorCnpjRegex);
        document.getElementById('nomePagador').value = extractData(pagadorNomeRegex);

        // Limpa o CNPJ do pagador de possíveis erros de OCR
        let cnpjPagadorLimpo = extractData(pagadorCnpjRegex).replace(/[.,]/g, '').replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
        document.getElementById('cnpjPagador').value = cnpjPagadorLimpo;
        
        document.getElementById('agenciaPagador').value = extractData(agenciaRegex);
        document.getElementById('contaPagador').value = extractData(contaRegex);
        document.getElementById('devedor').value = extractData(devedorRegex);

        // Lógica para Instituição do Pagador
        const instPagadorMatch = extractData(instPagadorRegex);
        if (instPagadorMatch) {
             document.getElementById('instPagador').value = instPagadorMatch.split('\n').pop() || "BCO DO BRASIL S.A.";
        }
    }
    
    // --- Funções de Feedback e UI (sem alterações) ---
    function setProcessingFeedback() {
        dropArea.className = 'processing';
        loadingSpinner.classList.remove('hidden');
        dropAreaText.textContent = 'Processando arquivo...';
    }

    function setSuccessFeedback(message) {
        dropArea.className = 'success';
        loadingSpinner.classList.add('hidden');
        dropAreaText.innerHTML = `<span style="color: #28a745; font-weight: bold;">${message}</span>`;
    }
    
    function setErrorFeedback(message) {
        dropArea.className = 'error';
        loadingSpinner.classList.add('hidden');
        dropAreaText.innerHTML = `<span style="color: #dc3545; font-weight: bold;">${message}</span>`;
    }

    gerarBtn.addEventListener('click', () => {
        document.getElementById('reciboValor').textContent = document.getElementById('valor').value;
        document.getElementById('reciboData').textContent = new Date().toLocaleDateString('pt-BR');
        document.getElementById('reciboNomeRecebedor').textContent = document.getElementById('nomeRecebedor').value;
        document.getElementById('reciboCnpjRecebedor').textContent = document.getElementById('cnpjRecebedor').value;
        document.getElementById('reciboInstRecebedor').textContent = document.getElementById('instRecebedor').value;
        document.getElementById('reciboNomePagador').textContent = document.getElementById('nomePagador').value;
        document.getElementById('reciboCnpjPagador').textContent = document.getElementById('cnpjPagador').value;
        document.getElementById('reciboAgenciaPagador').textContent = document.getElementById('agenciaPagador').value;
        document.getElementById('reciboContaPagador').textContent = document.getElementById('contaPagador').value;
        document.getElementById('reciboInstPagador').textContent = document.getElementById('instPagador').value;
        document.getElementById('reciboDevedor').textContent = document.getElementById('devedor').value;
        
        reciboContainer.style.display = 'block';
        imprimirBtn.classList.remove('hidden');
    });
    
    imprimirBtn.addEventListener('click', () => { window.print(); });
});