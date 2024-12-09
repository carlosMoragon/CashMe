    let importedData = [];

    function importKutxabankData() {
        const fileInput = document.getElementById('fileInput');
        if (!fileInput.files.length) {
            alert('Please select a file first.');
            return;
        }

        const formData = new FormData();
        formData.append('file', fileInput.files[0]);

        fetch('/transactions/importKutxabank', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error processing the request: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            console.log('Imported data:', data);
            importedData = data; // Store the imported data for later use
            displayDataAsTable(data);

            // Show the select and save button after successful import
            document.getElementById('importControls').style.display = 'block';
        })
        .catch(error => {
            console.log('Error importing the data:', error);
            alert('There was a problem importing the data. Please try again.');
        });
    }

    function displayDataAsTable(data) {
        const resultDiv = document.getElementById('result');
        resultDiv.innerHTML = ''; 

        const table = document.createElement('table');
        table.classList.add('table', 'table-bordered', 'table-hover');

        // Create table headers
        const headers = Object.keys(data[0]);
        let thead = table.createTHead();
        let row = thead.insertRow();
        headers.forEach(header => {
            let th = document.createElement('th');
            th.textContent = header;
            row.appendChild(th);
        });

        // Create table body
        let tbody = table.createTBody();
        data.forEach(item => {
            let row = tbody.insertRow();
            headers.forEach(header => {
                let cell = row.insertCell();
                cell.textContent = item[header];
            });
        });

        resultDiv.appendChild(table);
    }

    function saveImportData() {
        if (importedData.length === 0) {
            alert('No data to save. Please import data first.');
            return;
        }

        const accountSelect = document.getElementById('id_cuentaImport');
        const selectedAccountId = accountSelect.value;

        if (!selectedAccountId) {
            alert('Please select an account to save the data.');
            return;
        }

        fetch('/transactions/add-import', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                transactions: importedData,
                accountId: selectedAccountId // Asegúrate de que este valor se obtenga de 'id_cuenta'
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error saving the imported data: ' + response.statusText);
            }
            alert('Imported data saved successfully');
            // Recargar página
            window.location.reload();
        })
        .catch(error => {
            console.error('Error saving imported data:', error);
            alert('There was a problem saving the data. Please try again.');
        });
    }

    function exportTransactions() {
        const accountSelect = document.getElementById('id_cuenta');
        const selectedAccountId = accountSelect.value;

        if (!selectedAccountId) {
            alert('Please select an account to export transactions.');
            return;
        }

        fetch(`/transactions/export-csv/${selectedAccountId}`, {
            method: 'GET'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error exporting transactions: ' + response.statusText);
            }
            return response.blob();
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `transactions_${selectedAccountId}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        })
        .catch(error => {
            console.error('Error exporting transactions:', error);
            alert('There was a problem exporting the transactions. Please try again.');
        });
    }
