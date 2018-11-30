let base_url = 'https://marcostevanon.ovh:1883/';
var now = moment();
var selected_course = 'none';
var course_list;
if (localStorage.getItem('course-list')) {
    course_list = JSON.parse(localStorage.getItem('course-list'));
}
if (localStorage.getItem('selected_course')) {
    selected_course = localStorage.getItem('selected_course');
}
var fetch_links = {
    lastupdt: {
        url: `${base_url}lastupdt/${selected_course}`,
        ls_label: 'lst'
    },
    sectiontimes: {
        url: `${base_url}times/${selected_course}?date=${moment(now).add(2/*week end friday, saturday times are hidden*/, 'day').startOf('isoweek').format('YYYY-MM-DD')}`,
        ls_label: 'stm'
    },
    sectionheader: {
        url: `${base_url}course/${selected_course}`,
        ls_label: 'shd'
    }
}

function setSelectedCourse(course) {
    selected_course = course;
    saveSelectedCourse();
    location.reload();
}

function saveSelectedCourse() {
    localStorage.setItem('selected_course', selected_course);
}


function internal_error(err = '') {
    $('#loading').hide();
    $('#section').hide();
    $('#footer').hide();
    $('.error').show();
    $('#error-message').text('Error: ' + err);

    //localStorage.clear();
    //let q = new URLSearchParams(window.location.search).get('q');
    // se sto coso è statico, perchè è qui e non direttamente nell html
    $('.error').append(`<br><br>
        <div class="alert alert-warning" style="display: inline-block">
            <h5><b>Attenzione</b></h5>
            in seguito ad un intervento di manutenzione<br>
            alcuni link potrebbero non funzionare,<br>
            clicca <b>Vai alla Home</b> per tornare ad utilizzare l\'app
        </div>`);

    throw "network error";
}

async function getCourseList() {
    if (course_list && course_list.length > 0) {
        return course_list;
    }
    course_list = await fetch(`${base_url}course/list`)
        .then(res => res.json())
        .catch(function (err) {
            console.log('Error: ' + err);
            internal_error('network error');
            return [];
        })
    localStorage.setItem('course-list', JSON.stringify(course_list));
    return course_list;
}

function isQueryValid(courseList, query) {
    try {
        if (courseList.find(item => { return item.csvCode == query }))
            return true;
        else
            return false;
    } catch (err) {
        console.log(err);
        return false;
    }
}

function generateNavbarList(courseList, query) {
    var group = 1;
    courseList.forEach(item => {
        if (item.year !== group) {
            group = item.year;
            $('#course-list').append(`<div class="spacer"></div>`);
        }

        $('#course-list').append(`
            <li class="nav-item"><div class="nav-link">                
                    <button type="button" class="btn btn-sm btn-block my-btn
                        ${item.csvCode === query ? 'btn-light' : 'btn-outline-light'}" onclick="setSelectedCourse('${item.csvCode}')">
                        ${item.name}
                    </button>                
            </div></li>`);
    });
    $('#course-list').append(`<div class="spacer"></div>`);
}

async function setHomeMenu() {
    let courseList = await getCourseList();

    var group = 0;
    courseList.forEach(item => {
        if (item.year !== group) {
            group = item.year;
            $('#home-course-list').append(`<div class="col-12 text-left spacer">${item.year}° Anno</div>`)
        }

        $('#home-course-list').append(`
            <div class="col">
                <button class="btn btn-sm btn-block btn-outline-dark btn-bold" type="button" onclick="setSelectedCourse('${item.csvCode}')">
                    ${item.name}
                </button>
            </div>`);
    });
    $('#course-list').append(`<div style="color: white" class="spacer"></div>`);
}

async function setSectionHeader() {
    let courseCurrent = await fetchData(fetch_links.sectionheader, selected_course);
    if (courseCurrent) {
        $('#title').text(`${courseCurrent.type} - ${courseCurrent.name}`);
        $('#course-title').text(`${courseCurrent.type} - ${courseCurrent.name}`);
    }
    else {
        console.log(err);
    }
}

async function setSectionLastUpdate() {
    let lastUpdate = await fetchData(fetch_links.lastupdt, selected_course);
    if (lastUpdate) {
        $('#last-update').text(moment(lastUpdate).toNow(true) + ' fa');
    }
    else {
        $('#last-update').text('N.D.');
    }
}
//fetchSectionTimes
async function fetchData(act_param, query) {
    let localStorage_label = query + act_param.ls_label;
    let tmp = localStorage.getItem(localStorage_label);

    if (tmp) {
        fetch(act_param.url)
            .then(function (resp) {
                resp.json()
                    .then(res => localStorage.setItem(localStorage_label, JSON.stringify(res)),
                        err => console.log(err));
            })
            .catch(function (err) {
                console.log(err);
            });
        try {
            return JSON.parse(tmp);
        } catch (err) {
            return tmp;
        }
    }
    //'https://marcostevanon.ovh:1883/'
    tmp = await fetch(act_param.url)
        .then(function (resp) {
            return resp.json();
        })
        .catch(function (err) {
            console.log(err);
            internal_error('network error');
            return undefined;
        });
    if (tmp) {
        localStorage.setItem(localStorage_label, JSON.stringify(tmp));
    }
    return tmp;
}


async function setSectionTimes(times) {

    //Notification
    //$('#times-list').append(`<li class="list-group-item data" style="background-color: #88e66f"><a href="#"><b>Abilita Notifiche!</b></a></li>`);

    let odd = 0;
    let current_week_start = null;
    let current_day_of_week = null;
    let current_data_of_day = null;

    let timesComplete = [];

    while (times.length) {
        let item = times.splice(0, 1)[0];

        //continue if array has not times with the item.date
        //if (timesComplete.length) 
        if (parseInt(item.timestart.split(':')[0]) < 12)
            timesComplete.push({ id: null })
        timesComplete.push(item);

        /*
        if (!_.filter(timesComplete, i => {
            return moment(i.date).isSame(moment(item.date))
        }).length) {
            timesComplete.push({ id: null })
        }*/
    }

    //timesComplete.push(item[0]);

    timesComplete.forEach(timeItem => {
        if (timeItem.id == null) {
            //$('#times-list').append(`<li class="list-group-item data"><div class="row"><div class="col">---</div></div></li>`);
        } else {
            odd++;

            let times_start = moment(timeItem.date).startOf('isoweek');
            let old = moment(moment(timeItem.date).format('DDMMYYYY') + timeItem.timeend, 'DDMMYYYYHH:mm:ss').isBefore(moment(now));

            if (!moment(times_start).isSame(current_week_start)) {
                current_week_start = times_start;
                let current_week_end = moment(timeItem.date).endOf('isoweek').subtract(2, 'days');

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

              var title = timeItem.moduleName;
              // var title = null;
              // if (timeItem.moduleName) {
              //     var titleTemp = timeItem.moduleName.split(' - ');
              //     if (titleTemp.length > 1) title = titleTemp.slice(0, -1).join(' - ');
              //     else title = titleTemp;
              // }

              /*console.log(current_data_of_day);
              console.log(timeItem);
              console.log('\n');
              if (current_data_of_day)
                  if (!moment(current_data_of_day.date).isSame(moment(timeItem.date))
                      || (!moment(current_data_of_day.date).isSame(moment(timeItem.date))
                          && parseInt(timeItem.timestart.split(':')[0]) < 12)

                  ) { $('#times-list').append(`<li class="list-group-item data"><div class="row"><div class="col">/</div></div></li>`); }
              */

              var single_item = `<li id="${timeItem.webID ? timeItem.webID : odd}" class="list-group-item data ${attributes}">
                <div class="container-fluid">
                    <div class="row">
                        <div class="col-xs-12 prof-right">
                            <b class="title-left ${moment(moment(timeItem.date).format('DDMMYYYY') + timeItem.timeend, 'DDMMYYYYHH:mm:ss').isBefore(moment(now)) ? 'old-title' : ''}">
                                ${title}
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
                        <div class="col-12 ${old ? 'note-head-old' : 'note-head'}">
                            <div class="${old ? 'note-old' : 'note'}">${timeItem.note}</div>
                        </div>
                    </div>`
            }

            single_item += `</li>`;

            $('#times-list').append(single_item);
            current_data_of_day = timeItem;
        }
    });
    //$('#times-list').append(`<li class="list-group-item data" style="background-color: #88e66f"><a href="#"><b>Statistiche</b></a></li>`);
}

async function load() {
    let courseList = await getCourseList();
    //pageToInit();
    if (selected_course !== 'none' && isQueryValid(courseList, selected_course))
        await showLessons();
    else {
        await showHome();
        selected_course = 'none';
    }

    saveSelectedCourse();
    $('[data-toggle="tooltip"]').tooltip();
}

async function showLessons() {
    //if (!localStorage.getItem('course')) localStorage.setItem('course', query);

    $('#info-visualizer').hide();
    generateNavbarList(await getCourseList(), selected_course);
    await setSectionHeader();
    await setSectionLastUpdate();
    let times = await fetchData(fetch_links.sectiontimes, selected_course);

    if (!times.length) {
        $('#times-list').append('<h5 class="mt-2">Nessun dato</h5>');
    } else {
        await setSectionTimes(times);
    }
    $('#loading').hide();
    $('.error').hide();
}

async function showHome() {
    $('#loading').hide();
    $('.error').hide();
    $('#btn-expand').hide();
    $('#course-list').hide();
    $('#time-visualizer').hide();
    $('#footer').hide();

    $('#info-visualizer').show();

    await setHomeMenu();
}

/* function pageToInit() {
    $('body > *').not('script').remove();
    $('body > script:first').before(original_body);
} */

try {
    //getCourseList();
    load();
} catch (err) {
    console.log(err);
    internal_error('unknown');
}