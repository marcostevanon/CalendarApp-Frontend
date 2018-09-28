let urlParams = new URLSearchParams(window.location.search);
let query = urlParams.get('q');
let base_url = 'http://192.168.1.109:1883/';
var requests = []

/*
1 -->   get all course to show list of courses
2 -->   get detail of the chosen course
3 -->   get last update
4 -->   get all times for the chosen course*/

async function load() {
    var courseList = await fetch(`${base_url}course/list`).then(res => res.json());

    //List creation
    courseList.forEach(item => {
        $('#course-list').append(`<li class="nav-item">
            <a class="nav-link" href="?q=${item.csvCode}">
                <button class="btn btn-sm btn-block 
                    ${item.csvCode === query ? 'btn-light' : 'btn-outline-light'} 
                    btn-bold" type="button">${item.name}</button>
            </a></li>`);
    });

    if (query) {
        $('#info-visualizer').hide();

        var courseCurrent = await fetch(`${base_url}course/${query}`).then(res => res.json());
        var lastUpdate = await fetch(`${base_url}lastupdt/${query}`).then(res => res.json());
        var times = await fetch(`${base_url}times/${query}?date=${moment().startOf('isoweek').format('YYYY-MM-DD')}`).then(res => res.json());

        $('#title').text(`${courseCurrent.type} - ${courseCurrent.name}`);
        $('#course-title').text(`${courseCurrent.type} - ${courseCurrent.name}`);
        $('#last-update').text(moment(lastUpdate).subtract(2, 'hours').toNow(true) + ' ago');

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

            var single_item = `<li id="${times[0].webID}"
                class="list-group-item data 
                    ${moment(timeItem.date).isBefore(moment()) ? 'old' : ''} 
                    ${odd % 2 == 0 ? 'dark' : ''}
                    ${moment(timeItem.date).startOf('day').isSame(moment().startOf('day')) ? 'data-current' : ''} 
                    ${moment().isBetween(
                    moment(moment(timeItem.date).format('DDMMYYYY') + timeItem.timestart, 'DDMMYYYYHH:mm:ss'),
                    moment(moment(timeItem.date).format('DDMMYYYY') + timeItem.timeend, 'DDMMYYYYHH:mm:ss'))
                    ? 'blink-bg' : ''}">
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
                                    <div class="building S">Bld. ${timeItem.building}</div>
                                </div>`
            } else { single_item += `<div class="room">Location N.A.</div>` }
            single_item += `</td></tr></tbody></table></li>`;

            $('#times-list').append(single_item);

        });


        $('#loading').hide();
    } else {
        $('#loading').hide();
        $('#footer').hide();
        $('#time-visualizer').hide();

    }
}

load();