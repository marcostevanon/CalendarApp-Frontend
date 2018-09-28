let urlParams = new URLSearchParams(window.location.search);
let query = urlParams.get('q');
let base_url = 'http://localhost:3000/';
var requests = []

/*
1 -->   get all course to show list of courses
        <div id="course-list"></div>

2 -->   get detail of the chosen course

3 -->   get last update
        <div class="last-update"></div>

4 -->   get all times for the chosen course
*/

async function load() {
    var courseList = await fetch(`${base_url}course/list`).then(res => res.json());
    console.log(courseList);
    courseList.forEach(item => {
        $('#course-list').append(item);
    });


    if (query) {
        var courseCurrent = await fetch(`${base_url}course/${query}`).then(res => res.json());
        var lastUpdate = await fetch(`${base_url}lastupdt/${query}`).then(res => res.json());
        var times = await fetch(`${base_url}times/${query}?date=2018-09-20`).then(res => res.json());



        $('#loading').hide()
    }
}

load();