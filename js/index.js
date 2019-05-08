let base_url = '';
if (window.location.href.split('.')[0].split('/')[2])
    base_url = 'https://dev.api.calendar.marcostevanon.ovh/';
else
    base_url = 'https://api.calendar.marcostevanon.ovh/';

var now = moment();
var selected_course = 'none';
var loader = $('#loading');
var appBody = $('#app-body');
var mobile_btn = $('#btn-expand');
var footer = $('#footer');
var updateTimer;
var course_list;
if (localStorage.getItem('course-list')) {
    course_list = JSON.parse(localStorage.getItem('course-list'));
}
if (localStorage.getItem('selected_course')) {
    selected_course = localStorage.getItem('selected_course');
}
var fetch_links = {
    lastupdt: {
        url: () => `${base_url}lastupdt/${selected_course}`,
        ls_label: 'lst'
    },
    sectiontimes: {
        url: () => `${base_url}times/${selected_course}?date=${moment(now).add(2/*week end friday, saturday times are hidden*/, 'day').startOf('isoweek').format('YYYY-MM-DD')}`,
        ls_label: 'stm'
    },
    sectionheader: {
        url: () => `${base_url}course/${selected_course}`,
        ls_label: 'shd'
    }
}

async function setSelectedCourse(course) {
    selected_course = course;
    $('#btn-expand').trigger('click')
    saveSelectedCourse();
    await updateData(selected_course);
    load();
}

function saveSelectedCourse() {
    localStorage.setItem('selected_course', selected_course);
}

function internal_error(err = '') {
    //$('#section').hide();
    loader.show();
    footer.hide();
    appBody.empty();
    appBody.append(`<div class="error text-center mt-5">
                        <img src="res/cal-100.png" width="100" height="100" class="mt-5" alt="itslogo192">
                        <h4 class="mt-3">Something goes wrong</h4>
                        <code id="error-message"></code><br>
                        <button id="btn-home" type="button" class="btn btn-info mt-3" onclick="setSelectedCourse('none')">Vai
                            alla Home</button>
                        <br><br>
                        <div class="alert alert-warning" style="display: inline-block">
                            <h5><b>Attenzione</b></h5>
                            in seguito ad un intervento di manutenzione<br>
                            alcuni link potrebbero non funzionare,<br>
                            clicca <b>Vai alla Home</b> per tornare ad utilizzare l\'app
                        </div>
                    </div>`);

    $('#error-message').text('Error: ' + err);
    loader.hide();
    throw "network error";
}

async function getCourseList() {
    if (course_list && course_list.length > 0) {
        fetch(`${base_url}course/list`)
            .then(res => res.json())
            .then(result => {
                localStorage.setItem('course-list', JSON.stringify(result));
            })
            .catch((err) => {
                console.log('Error: ' + err);
            });
        return course_list;
    }
    course_list = await fetch(`${base_url}course/list`)
        .then(res => res.json())
        .then(result => result)
        .catch((err) => {
            console.log('Error: ' + err);
            throw 'network error';
        });
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
    let courseListNav = $('#nav-course-list');
    courseListNav.empty();
    var group = 1;
    courseList.forEach(item => {
        if (item.year !== group) {
            group = item.year;
            courseListNav.append(`<div class="spacer"></div>`);
        }

        courseListNav.append(`
            <li class="nav-item"><div class="nav-link">                
                    <button type="button" class="btn btn-sm btn-block my-btn
                        ${item.csvCode === query ? 'btn-light' : 'btn-outline-light'}" onclick="setSelectedCourse('${item.csvCode}')">
                        ${item.name}
                    </button>                
            </div></li>`);
    });
    courseListNav.append(`<div class="spacer"></div>`);
}

async function setCourseHomeMenu(courseList) {
    let homeCourseList = $('#home-course-list');
    homeCourseList.empty();

    var group = 0;
    courseList.forEach(item => {
        if (item.year !== group) {
            group = item.year;
            homeCourseList.append(`<div class="col-12 text-left spacer">${item.year}° Anno</div>`)
        }

        homeCourseList.append(`
            <div class="col">
                <button class="btn btn-sm btn-block btn-outline-dark btn-bold" type="button" onclick="setSelectedCourse('${item.csvCode}')">
                    ${item.name}
                </button>
            </div>`);
    });
    //$('#nav-course-list').append(`<div style="color: white" class="spacer"></div>`);
}

function setSectionHeader(course) {
    if (course) {
        $('#title').text(`${course.type} - ${course.name}`);
        $('#course-title').text(`${course.type} - ${course.name}`);
    }
    else {
        console.log(err);
    }
}

function setSectionLastUpdate(lastUpdate) {
    if (lastUpdate) {
        $('#last-update').text(moment(lastUpdate).toNow(true) + ' fa');
    }
    else {
        $('#last-update').text('N.D.');
    }
}

//with the use of Promise.all now the data will be updated only if both the three request fullfill
async function updateData(course, forceReload) {
    let updateChain = [
        getPromiseGET(fetch_links.lastupdt.url()),
        getPromiseGET(fetch_links.sectionheader.url()),
        getPromiseGET(fetch_links.sectiontimes.url())
    ]
    await Promise.all(updateChain)
        .then(resArray => {
            localStorage.setItem(course + fetch_links.sectionheader.ls_label,
                toLocalStorage(resArray[1]));

            localStorage.setItem(course + fetch_links.sectiontimes.ls_label,
                toLocalStorage(resArray[2]));

            if (resArray[0] !== getDataLocal(fetch_links.lastupdt.ls_label, course)) {
                localStorage.setItem(course + fetch_links.lastupdt.ls_label,
                    toLocalStorage(resArray[0]));
                if (forceReload)
                    showLessons();
            }
        })
        .catch(err => {
            console.log(err);
            clearTimeout(updateTimer);
            updateTimer = setTimeout(() => {
                if (selected_course !== 'none')
                    updateData(selected_course, true);
            }, 25000);
        });
}

function toLocalStorage(elem) {
    return isString(elem) ? elem : JSON.stringify(elem);
}

function isString(elem) {
    if (typeof elem == 'string' || elem instanceof String)
        return true;
    return false;
}

function getPromiseGET(url) {
    return new Promise((resolve, reject) => {
        fetch(url)
            .then(res => {
                if (res.ok) {
                    let header = res.headers.get('Content-Type');
                    if (header && header.indexOf('application/json') !== -1)
                        return res.json();
                    else
                        return res.text();
                }
                throw 'got one error while fetching ' + url;
            })
            .then(finalResult => resolve(finalResult))
            .catch(err => reject(err))
    });
}

function setSectionTimes(times) {

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

function getDataLocal(typeData, course) {
    let data = localStorage.getItem(course + typeData);
    try {
        return JSON.parse(data);
    } catch (e) {
        return data;
    }
    //return isString(data) ? data : JSON.parse(data);
}

async function load() {
    let courseList = await getCourseList();
    //pageToInit();
    if (selected_course !== 'none' && isQueryValid(courseList, selected_course))
        if (getDataLocal(fetch_links.sectiontimes.ls_label, selected_course))
            await showLessons();
        else
            internal_error('network error');
    else {
        await showHome();
        selected_course = 'none';
        saveSelectedCourse();
    }

    $('[data-toggle="tooltip"]').tooltip();
}

async function showLessons() {
    //if (!localStorage.getItem('course')) localStorage.setItem('course', query);
    loader.show();
    appBody.empty();
    appBody.append(`<div id="time-visualizer" class="row">
                        <div class="col-md-2 col-lg-3"></div>
                        <div class="col-sm-12 col-md-8 col-lg-6">
                            <h5 class="course-title">Orari per <b id="course-title"></b></h5>

                            <div class="last-update"><em>Ultimo aggiornamento: <b id="last-update"></b></em></div>

                            <div class="card table-list">
                                <ul id="times-list" class="list-group list-group-flush">
                                    <!--Times Visualization-->
                                </ul>
                            </div>
                        </div>
                    </div>`);

    generateNavbarList(await getCourseList(), selected_course);
    setSectionHeader(getDataLocal(fetch_links.sectionheader.ls_label, selected_course));
    setSectionLastUpdate(getDataLocal(fetch_links.lastupdt.ls_label, selected_course));
    let times = getDataLocal(fetch_links.sectiontimes.ls_label, selected_course);

    if (!times.length) {
        $('#times-list').append('<h5 class="mt-2">Nessun dato</h5>');
    } else {
        setSectionTimes(times);
    }
    footer.show();
    loader.hide();
}

async function showHome() {
    appBody.empty();
    appBody.append(`<div id="home-visualizer" class="row">
                        <div class="col-sm-1 col-md-2 col-lg-3"></div>
                        <div class="col-xs-12 col-sm-10 col-md-8 col-lg-6">
                            <div class="row">
                                <img src="res/cal-100.png" width="100" height="100" class="ml-auto mr-auto mt-4" alt="itslogo192">
                                <h3 class="col-12 mt-2">Seleziona un corso</h3>

                                <div class="col-12">
                                    <div id="home-course-list" class="row mt-3">
                                        <!-- Home List Visualization -->
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>`);
    mobile_btn.hide();
    $('#nav-course-list').empty();
    footer.hide();
    await setCourseHomeMenu(await getCourseList());
    loader.hide();
}

try {
    load();
    if (selected_course !== 'none')
        updateData(selected_course, true);
} catch (err) {
    console.error(err);
    internal_error(err);
}