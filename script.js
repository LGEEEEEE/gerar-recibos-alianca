document.addEventListener('DOMContentLoaded', () => {
    // Botões e contêineres principais
    const gerarBtn = document.getElementById('gerarBtn');
    const imprimirBtn = document.getElementById('imprimirBtn');
    const reciboContainer = document.getElementById('reciboContainer');

    // Elementos para upload de imagem
    const dropArea = document.getElementById('drop-area');
    const fileElem = document.getElementById('fileElem');
    const comprovanteAnexadoContainer = document.getElementById('comprovanteAnexadoContainer');
    const imagemComprovante = document.getElementById('imagemComprovante');

    // --- LÓGICA PARA UPLOAD DE IMAGEM (DRAG & DROP, CLICK, PASTE) ---

    // Função para prevenir comportamentos padrões do navegador
    const preventDefaults = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    // Adiciona a classe de destaque ao arrastar sobre a área
    const highlight = () => dropArea.classList.add('highlight');
    // Remove a classe de destaque
    const unhighlight = () => dropArea.classList.remove('highlight');

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });

    // Lida com o arquivo solto na área
    dropArea.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFile(files[0]);
    }, false);

    // Permite selecionar o arquivo clicando na área
    dropArea.addEventListener('click', () => {
        fileElem.click();
    });
    fileElem.addEventListener('change', function() {
        handleFile(this.files[0]);
    });
    
    // Lida com a imagem colada (Ctrl+V)
    document.addEventListener('paste', (e) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const file = items[i].getAsFile();
                handleFile(file);
                // Informa ao usuário que a imagem foi colada
                dropArea.innerHTML = '<p style="color: green; font-weight: bold;">Imagem colada com sucesso!</p>';
                setTimeout(() => {
                    dropArea.innerHTML = '<p>Arraste e solte o arquivo de imagem aqui, ou clique para selecionar.</p><p>Você também pode copiar a imagem e colar (Ctrl+V).</p>';
                }, 2000);
            }
        }
    });

    // Função principal para processar o arquivo de imagem
    function handleFile(file) {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imagemComprovante.src = e.target.result;
                comprovanteAnexadoContainer.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        } else {
            alert('Por favor, anexe um arquivo de imagem válido (JPG, PNG, etc).');
        }
    }


    // --- LÓGICA PARA GERAR O COMPROVANTE ---

    gerarBtn.addEventListener('click', () => {
        // Captura os valores do formulário
        const valor = document.getElementById('valor').value;
        const devedor = document.getElementById('devedor').value;
        const nomeRecebedor = document.getElementById('nomeRecebedor').value;
        const cnpjRecebedor = document.getElementById('cnpjRecebedor').value;
        const instRecebedor = document.getElementById('instRecebedor').value;
        const nomePagador = document.getElementById('nomePagador').value;
        const cnpjPagador = document.getElementById('cnpjPagador').value;
        const agenciaPagador = document.getElementById('agenciaPagador').value;
        const contaPagador = document.getElementById('contaPagador').value;
        const instPagador = document.getElementById('instPagador').value;

        // Formata a data atual
        const hoje = new Date();
        const dia = String(hoje.getDate()).padStart(2, '0');
        const mes = String(hoje.getMonth() + 1).padStart(2, '0');
        const ano = hoje.getFullYear();
        const dataFormatada = `${dia}/${mes}/${ano}`;

        // Preenche os dados no recibo
        document.getElementById('reciboValor').textContent = valor;
        document.getElementById('reciboData').textContent = dataFormatada;
        document.getElementById('reciboNomeRecebedor').textContent = nomeRecebedor;
        document.getElementById('reciboCnpjRecebedor').textContent = cnpjRecebedor;
        document.getElementById('reciboInstRecebedor').textContent = instRecebedor;
        document.getElementById('reciboNomePagador').textContent = nomePagador;
        document.getElementById('reciboCnpjPagador').textContent = cnpjPagador;
        document.getElementById('reciboAgenciaPagador').textContent = agenciaPagador;
        document.getElementById('reciboContaPagador').textContent = contaPagador;
        document.getElementById('reciboInstPagador').textContent = instPagador;
        document.getElementById('reciboDevedor').textContent = devedor;
        
        // Mostra o recibo e o botão de imprimir
        reciboContainer.style.display = 'block';
        imprimirBtn.classList.remove('hidden');
    });
    
    imprimirBtn.addEventListener('click', () => {
        window.print();
    });
});