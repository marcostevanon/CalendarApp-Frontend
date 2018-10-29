let urlParams = new URLSearchParams(window.location.search);
let query = urlParams.get('q');
let base_url = 'https://marcostevanon.ovh:1883/';

var now = moment().subtract(0, 'day')

function internal_error(err = '') {
    $('#loading').hide();
    $('#section').hide();
    $('#footer').hide();
    $('.error').show();
    $('#error-message').text('Error: ' + err);
}

async function load() {
    console.log(query);
    if (localStorage.getItem('course') && !query)
        window.location.href = '?q=' + localStorage.getItem('course');
    if (query == 'home') query = null;
    if (query) {
        if (!localStorage.getItem('course')) localStorage.setItem('course', query);

        $('#info-visualizer').hide();

        //fetch and create COURSE LIST
        try {
            var courseList = await fetch(`${base_url}course/list`).then(res => res.json());
        } catch (err) { internal_error('network error'); return; }

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
                        <span ${!item.active ? 'tabindex="0" data-toggle="tooltip" data-placement="bottom" title="Corso non disponibile"' : ''}>
                            <button class="btn btn-sm btn-block ${item.csvCode === query ? 'btn-light' : 'btn-outline-light'} btn-bold my-btn"
                                type="button" ${!item.active ? 'disabled style="pointer-events: none;"' : ''}
                                onclick="window.location = '?q=${item.csvCode}'">${item.name}
                            </button>
                        </span>
                    </div>
                </li>`);
        });
        $('#course-list').append(`<div style="color: white" class="spacer"></div>`);

        //check query
        var query_check = courseList.find((item) => {
            return item.csvCode == query;
        });

        if (!query_check) {
            internal_error('course does not exist');
            return;
        }

        try {
            var times = await fetch(`${base_url}times/${query}?date=${moment(now).add(2/*week end friday, saturday times are hidden*/, 'day').startOf('isoweek').format('YYYY-MM-DD')}`).then(res => res.json());
            var courseCurrent = await fetch(`${base_url}course/${query}`).then(res => res.json());
        } catch (err) {
            internal_error('network error'); return;
        }

        $('#title').text(`${courseCurrent.type} - ${courseCurrent.name}`);
        $('#course-title').text(`${courseCurrent.type} - ${courseCurrent.name}`);

        try {
            var lastUpdate = await fetch(`${base_url}lastupdt/${query}`).then(res => res.json());
            $('#last-update').text(moment(lastUpdate).toNow(true) + ' fa');
        } catch (err) {
            $('#last-update').text('N.D.');
        }

        if (!times.length) {
            $('#times-list').append('<h5 class="mt-2">Nessun dato</h5>');
        } else {
            //Notificarion
            //$('#times-list').append(`<li class="list-group-item data" style="background-color: #88e66f"><a href="#"><b>Abilita Notifiche!</b></a></li>`);

            var odd = 0;
            var current_week_start = null;
            var current_day_of_week = null;

            times.forEach(timeItem => {
                odd++;

                var times_start = moment(timeItem.date).startOf('isoweek');
                var old = moment(moment(timeItem.date).format('DDMMYYYY') + timeItem.timeend, 'DDMMYYYYHH:mm:ss').isBefore(moment(now));

                if (!moment(times_start).isSame(current_week_start)) {
                    current_week_start = times_start;
                    var current_week_end = moment(timeItem.date).endOf('isoweek').subtract(2, 'days');

                    $('#times-list').append(`<li class="week-divider ${moment(now).isBetween(current_week_start, current_week_end) ? 'week-current' : ''}">
                    ${moment(current_week_start).format('ddd D MMM').toLowerCase()} - ${moment(current_week_end).format('ddd D MMM').toLowerCase()}</li>`);
                }

                if (current_day_of_week !== timeItem.date) {
                    current_day_of_week = timeItem.date;
                    $('#times-list').append(`<li class="day-divider dark text-center ${old ? 'old-week' : ''}">${moment(timeItem.date).format('ddd D MMM \'YY')}</li>`);
                }

                var hours = { start: timeItem.timestart.split(':'), end: timeItem.timeend.split(':') }

                var attributes = '';//(odd % 2 == 0 ? 'dark' : '');
                attributes += ' ' + (old ? 'old' : '');
                attributes += ' ' + (moment(now).isBetween(
                    moment(timeItem.date).startOf('day'),
                    moment(moment(timeItem.date).format('DDMMYYYY') + timeItem.timeend, 'DDMMYYYYHH:mm:ss')) ? 'data-current' : '');
                attributes += ' ' + (moment(now).isBetween(
                    moment(moment(timeItem.date).format('DDMMYYYY') + timeItem.timestart, 'DDMMYYYYHH:mm:ss'),
                    moment(moment(timeItem.date).format('DDMMYYYY') + timeItem.timeend, 'DDMMYYYYHH:mm:ss')) ? 'blink-bg' : '');
                var single_item = `<li id="${timeItem.webID ? timeItem.webID : odd}" class="list-group-item data ${attributes}">
                    <div class="container-fluid">
                        <div class="row">
                            <div class="col-xs-12 prof-right">
                                <b class="title-left ${moment(moment(timeItem.date).format('DDMMYYYY') + timeItem.timeend, 'DDMMYYYYHH:mm:ss').isBefore(moment(now)) ? 'old-title' : ''}">
                                    ${timeItem.moduleName}
                                </b>
                                <div class="prof">
                                    <em>${timeItem.prof}</em>
                                </div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-6 pc50sx">
                                <div class="date">
                                    ${moment(timeItem.date).format('ddd D MMM \'YY').toLowerCase()}&nbsp;&nbsp;
                                    <div class="time ${parseInt(hours.start) <= 13 ? 'AM' : 'PM'} ${old ? 'old-data' : ''}">
                                        ${hours.start[0]}${parseInt(hours.start[1]) ? ':' + hours.start[1] : ''} - ${hours.end[0]}${parseInt(hours.end[1]) ? ':' + hours.end[1] : ''}</div>
                                </div>
                            </div>
                            <div class="col-6 pc50dx">`;

                if (timeItem.room) {
                    single_item += `<div class="room">${timeItem.room}<div class="room-divider">&nbsp;-&nbsp;</div>
                                        <div class="building ${timeItem.building === 'B' ? 'B' : 'S'} ${old ? 'old-data' : ''}">Edf. ${timeItem.building}</div>
                                    </div></div></div>`
                } else { single_item += `<div class="room" data-toggle="tooltip" data-placement="right" title="Posizione non disponibile">N.D.</div></div></div>` }

                if (timeItem.note) {
                    single_item += `
                        <div class="row">
                            <div class="col-12 py-1 px-0">
                                <div class="note">
                                    ${timeItem.note}</div>
                                </div>
                        </div>`
                }

                single_item += `</li>`;

                $('#times-list').append(single_item);

            });
        }

        //$('#times-list').append(`<li class="list-group-item data" style="background-color: #88e66f"><a href="#"><b>Statistiche</b></a></li>`);

        $('#loading').hide();
        $('.error').hide();
    } else {
        $('#loading').hide();
        $('.error').hide();
        $('#btn-expand').hide();
        $('#course-list').hide();
        $('#time-visualizer').hide();
        $('#footer').hide();
    }
    $('[data-toggle="tooltip"]').tooltip();
}

try {
    load();
} catch (err) {
    internal_error('unknown');
}