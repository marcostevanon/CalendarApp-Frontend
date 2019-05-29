fetch(`https://api.calendar.marcostevanon.ovh/log`)
    .then(res => res.json())
    .then(res => {
        res.forEach(item => {
            $('#scraper-table').append(
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

fetch(`https://api.calendar.marcostevanon.ovh/mail`)
    .then(res => res.json())
    .then(res => {
        res.forEach(item => {
            $('#mail-table').append(
                `<tr>
                    <th scope="row">${item.id}</th>
                    <td>${moment(item.date).format('DD/MM/YYYY H:mm:ss')}</td>
                    <td>${item.action}</td>
                    <td>${item.times}</td>
                </tr>`);
        });
    });