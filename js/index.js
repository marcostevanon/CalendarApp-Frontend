let urlParams = new URLSearchParams(window.location.search);
let query = urlParams.get('q');
let base_url = 'http://93.46.119.114:1883/';
var requests = []

/*
1 -->   get all course to show list of courses
2 -->   get detail of the chosen course
3 -->   get last update
4 -->   get all times for the chosen course*/



async function load() {
    try {
        var courseList = await fetch(`${base_url}course/list`).then(res => res.json());
    } catch (err) {
        $('#body').hide();
        $('.error').show();
    }

    //List creation
    var group = 1;
    courseList.forEach(item => {
        if (item.year !== group) {
            group = item.year;
            $('#course-list').append(`<div style="color: white" class="spacer"></div>`);
        }

        $('#course-list').append(`
            <li class="nav-item">
                <div class="nav-link">
                    <span ${!item.active ? 'tabindex="0" data-toggle="tooltip" data-placement="bottom" title="Nessun dato disponibile"' : ''}>
                        <button class="btn btn-sm btn-block ${item.csvCode === query ? 'btn-light' : 'btn-outline-light'} btn-bold my-btn"
                            type="button" ${!item.active ? 'disabled style="pointer-events: none;"' : ''}
                            onclick="window.location = '?q=${item.csvCode}'">${item.name}
                        </button>
                    </span>
                </div>
            </li>`);
    });
    $('#course-list').append(`<div style="color: white" class="spacer"></div>`);

    if (query) {
        $('#info-visualizer').hide();

        var courseCurrent = await fetch(`${base_url}course/${query}`).then(res => res.json());
        var lastUpdate = await fetch(`${base_url}lastupdt/${query}`).then(res => res.json());
        var times = await fetch(`${base_url}times/${query}?date=${moment().startOf('isoweek').format('YYYY-MM-DD')}`).then(res => res.json());

        $('#title').text(`${courseCurrent.type} - ${courseCurrent.name}`);
        $('#course-title').text(`${courseCurrent.type} - ${courseCurrent.name}`);
        $('#last-update').text(moment(lastUpdate).subtract(2, 'hours').toNow(true) + ' fa');

        //Notificarion
        //$('#times-list').append(`<li class="list-group-item data" style="background-color: #88e66f"><a href="#"><b>Abilita Notifiche!</b></a></li>`);

        var odd = 0;
        var current_week_start = null;

        times.forEach(timeItem => {
            var times_start = moment(timeItem.date).startOf('isoweek');
            odd++;

            if (!moment(times_start).isSame(current_week_start)) {
                current_week_start = times_start;
                var current_week_end = moment(timeItem.date).endOf('isoweek').subtract(2, 'days');

                $('#times-list').append(`<li class="week-divider ${moment().isBetween(current_week_start, current_week_end) ? 'week-current' : ''}">
                    ${moment(current_week_start).format('ddd D MMM').toLowerCase()} - ${moment(current_week_end).format('ddd D MMM').toLowerCase()}</li>`);
            }

            var hours = { start: timeItem.timestart.split(':'), end: timeItem.timeend.split(':') }

            var attributes = moment(timeItem.date).isBefore(moment()) ? 'old' : '';
            attributes += ' ' + odd % 2 == 0 ? 'dark' : '';
            attributes += ' ' + moment(moment(timeItem.date).format('DDMMYYYY') + timeItem.timeend, 'DDMMYYYYHH:mm:ss').isBetween(moment().startOf('day'), moment().endOf('day')) ? 'data-current' : '';
            attributes += ' ' + moment().isBetween(
                moment(moment(timeItem.date).format('DDMMYYYY') + timeItem.timestart, 'DDMMYYYYHH:mm:ss'),
                moment(moment(timeItem.date).format('DDMMYYYY') + timeItem.timeend, 'DDMMYYYYHH:mm:ss')) ? 'blink-bg' : '';
            var single_item = `<li id="${times[0].webID}"
                class="list-group-item data ${attributes}">
                <table class="full-table">
                    <tbody><tr>
                        <td colspan="2">
                        <div><b class="title-left">${timeItem.moduleName}</b>
                            <div class="prof"><em>${timeItem.prof}</em></div>
                        </div>
                    </td></tr>
                    <tr><td class="pc50sx">
                        <div class="date">${moment(timeItem.date).format('ddd D MMM \'YY').toLowerCase()}&nbsp;&nbsp;
                            <div class="time ${parseInt(hours.start) <= 13 ? 'AM' : 'PM'}">
                                ${hours.start[0]}${parseInt(hours.start[1]) ? ':' + hours.start[1] : ''} - ${hours.end[0]}${parseInt(hours.end[1]) ? ':' + hours.end[1] : ''}</div>
                        </div>
                    </td>
                    <td class="pc50dx">`;
            if (timeItem.room) {
                single_item += `<div class="room">${timeItem.room}<div class="room-divider">&nbsp;-&nbsp;</div>
                                    <div class="building ${timeItem.building === 'B' ? 'B' : 'S'}">Edf. ${timeItem.building}</div>
                                </div>`
            } else { single_item += `<div class="room" data-toggle="tooltip" data-placement="right" title="Posizione non disponibile">N.D.</div>` }
            single_item += `</td></tr></tbody></table></li>`;

            $('#times-list').append(single_item);
        });
        
        //$('#times-list').append(`<li class="list-group-item data" style="background-color: #88e66f"><a href="#"><b>Statistiche</b></a></li>`);

        $('#loading').hide();
        $('.error').hide();
    } else {
        $('.error').hide();
        $('#loading').hide();
        $('#time-visualizer').hide();
        $('#btn-expand').hide();
        $('#course-list').hide();
        $('#footer').hide();


    }
    $('[data-toggle="tooltip"]').tooltip();
}

load();