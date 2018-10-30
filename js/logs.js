fetch(`https://marcostevanon.ovh:1883/log`)
    .then(res => res.json())
    .then(res => {
        res.forEach(item => {
            $('#table-entry').append(
                `<tr>
                    <th scope="row">${item.id}</th>
                    <td>${moment(item.date).format('DD/MM/YYYY H:mm:ss')}</td>
                    <td>${item.courseCode}</td>
                    <td>${item.action}</td>
                    <td>${item.prof}</td>
                    <td>${item.times}</td>
                </tr>`);
        });
    });