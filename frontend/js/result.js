const params = new URLSearchParams(window.location.search);
const resultId = params.get("id");



// ---------- Load Result ----------
async function loadResult() {

    try {

        const response = await fetch(
            `http://127.0.0.1:5000/result/${resultId}`
        );

        const data = await response.json();

        const score = JSON.parse(
            data.score.replace(/'/g, '"')//به صورت رشته نتایج ذخیره میشه
        );

        console.log(data)
        showProfile(data);
        showStrengths(data);
        showJobs(data);
        showScores(score);

        showVideosByType(data.type, data.jobs)

    } catch (err) {
        console.error("Error:", err);
    }
}

loadResult();


// ---------- Videos matched to the assessment result ----------
// Videos are read from the existing jobsData.js file. No new or fabricated
// video URLs are introduced here.
function showVideosByType(type, recommendedJobs) {
    const jobs = Array.isArray(recommendedJobs)
        ? recommendedJobs
        : String(recommendedJobs || "")
            .split(/,|،/)
            .map(job => job.trim())
            .filter(Boolean);

    // Use the first recommended occupation that has learning/video data.
    const matchedJob = jobs.find(job => Object.prototype.hasOwnProperty.call(jobData, job));

    if (matchedJob) {
        showLearningPath(matchedJob);
        return;
    }

    // Fallback: match the Holland type to occupations already present in jobsData.
    const typeJobs = {
        R: ["تکنسین برق", "تعمیرکار موبایل", "طراح سه‌بعدی"],
        I: ["برنامه‌نویس", "تحلیلگر داده", "متخصص هوش مصنوعی"],
        A: ["طراح گرافیک", "طراح UI/UX", "تدوینگر ویدیو"],
        S: ["معلم", "روانشناس", "مشاور"],
        E: ["مدیر فروش", "دیجیتال مارکتر", "کارآفرین"],
        C: ["حسابدار", "کارشناس اکسل", "مدیر پروژه"]
    };

    const candidates = typeJobs[String(type || "").trim().toUpperCase()] || [];
    const fallbackJob = candidates.find(job =>
        Object.prototype.hasOwnProperty.call(jobData, job)
    );

    if (fallbackJob) {
        showLearningPath(fallbackJob);
        return;
    }

    // Do not display unrelated or fabricated videos when no match exists.
    if (videoTitle) videoTitle.textContent = "برای نتیجه فعلی ویدئوی مرتبطی ثبت نشده است.";
    if (videoFrame) videoFrame.removeAttribute("src");
}


// ---------- Profile ----------
function showProfile(data) {

    document.getElementById("personalityTitel").textContent = data.title;
    document.getElementById("personalityDescription").textContent = data.description;

}


// ---------- Strengths ----------


    function showStrengths(data) {
        const container=document.getElementById("strengths")

        container.replaceChildren();

        data.strengths.split(/,|،/).forEach(item => {

            const tag = document.createElement("span");

            tag.className =
                "tag-pill px-4 py-1.5 rounded-full text-sm";

            tag.textContent = item.trim();

            container.append(tag);

        });

    }



// ---------- Jobs ----------


function showJobs(data) {

    const container = document.getElementById("jobRow");

    container.replaceChildren();
    console.log(data.jobs);

    const jobs = data.jobs.split(/,|،/);

    

    jobs.forEach(job => {

        const card = document.createElement("div");
        card.className =
            "job-card panel-2 rounded-xl p-5  border border-orange-300 w-80 flex-shrink-0";

        const iconBox = document.createElement("div");
        iconBox.className =
            "w-10 h-10 rounded-lg flex items-center justify-center mb-3";
        iconBox.style.background = "rgba(249,115,22,0.15)";
        iconBox.textContent = "💼";

        const title = document.createElement("h4");
        title.className = "font-bold mb-2 ";
        title.textContent = job.trim();

        const button = document.createElement("button");
        button.className =
            "w-full py-2 rounded-lg text-sm border border-orange-500 text-orange-400 hover:bg-orange-500 hover:text-white transition";

        button.textContent = "مشاهده مسیر یادگیری";

        //  اینجا ویدیوهای  شغل رو نمایش میدیم
        button.addEventListener("click", () => {
            console.log("job",job)
            showLearningPath(job.trim());
        });

        card.appendChild(iconBox);
        card.appendChild(title);
        card.appendChild(button);

        container.appendChild(card);

    });

}

function showLearningPath(jobName) {

    currentJob = jobName.trim();

    const data = jobData[currentJob];

    if (!data) {
        console.log("برای این شغل داده‌ای پیدا نشد.");
        return;
    }

    console.log(data);

    pathTitle.textContent = `مسیر یادگیری ${currentJob}`;

    changeStage(0);

}
    


// ---------- Scores ----------
function showScores(score) {

    const container = document.querySelector("#scores");

    container.replaceChildren();

    const labels = {
        R: "🔧 واقع‌گرا",
        I: "🧠 پژوهشگر",
        A: "🎨 هنری",
        S: "🤝 اجتماعی",
        E: "👑 کارآفرین",
        C: "💼 قراردادی"
    };

    const max = Math.max(...Object.values(score));

    Object.keys(score).forEach(key => {

        const value = score[key];

        const percent = max ? (value / max) * 100 : 0;

        const row = document.createElement("div");
        row.className = "mb-5";

        const header = document.createElement("div");
        header.className = "flex justify-between mb-2";

        const title = document.createElement("span");
        title.textContent = labels[key];

        const number = document.createElement("span");
        number.textContent = value;

        header.appendChild(title);
        header.appendChild(number);

        const barBg = document.createElement("div");
        barBg.className = "w-full bg-slate-200 rounded-full h-4";

        const barFill = document.createElement("div");
        barFill.className = "bg-orange-500 h-4 rounded-full transition-all duration-500";
        barFill.style.width = `${percent}%`;

        barBg.appendChild(barFill);

        row.appendChild(header);
        row.appendChild(barBg);

        container.appendChild(row);

    });
}






// Job card carousel
const jobRow = document.getElementById('jobRow');
document.getElementById('scrollLeft').addEventListener('click', () => {
    jobRow.scrollBy({ left: -280, behavior: 'smooth' });
});
document.getElementById('scrollRight').addEventListener('click', () => {
    jobRow.scrollBy({ left: 280, behavior: 'smooth' });
});

// Video tab switching

const tabs = document.querySelectorAll('.video_tab');
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const v = videoData[tab.dataset.video];
        document.getElementById('videoHeadline').textContent = v.headline;
        document.getElementById('videoTitle').textContent = v.title;
        document.getElementById('videoDesc').textContent = v.desc;
        document.getElementById('videoTime').textContent = v.time;
        document.getElementById('videoDuration').textContent = v.duration;
        document.querySelectorAll('#videoHeadline, #videoTitle, #videoDesc').forEach(el => {
            el.classList.remove('fade-in');
            void el.offsetWidth;
            el.classList.add('fade-in');
        });
    });
});

// Stage selection
const stageItems = document.querySelectorAll('.stage-item');


stageItems.forEach(item => {
    item.addEventListener('click', () => {
        stageItems.forEach(i => {
            i.querySelector('.stage-box').classList.remove('stage-active');
            i.querySelector('.stage-box').classList.add('panel-2');
            i.querySelector('.num-circle').classList.remove('active');
        });
        item.querySelector('.stage-box-2').classList.add('stage-active-2');
        item.querySelector('.stage-box').classList.remove('panel-2');
        item.querySelector('.num-circle').classList.add('active');
    });
});

// Play button pulse
let currentJob = null;
let currentStage = 0;

const pathTitle = document.getElementById("pathTitle");
const stageTitle = document.getElementById("stageTitle");
const stageDesc = document.getElementById("stageDesc");

const videoTitle = document.getElementById("videoTitle");
const videoFrame = document.getElementById("videoFrame");

const videoButtons = document.querySelectorAll(".video_tab");


const videoBox = document.getElementById("videoBox");
const skillsBox = document.getElementById("skillsBox");
const skillButtons = document.querySelectorAll(".skill_tab");

const skillContent = document.getElementById("skilleContnt");
function showLearningPath(job) {

    currentJob = job;
    currentStage = 0;

    const data = jobData[job];

    if (!data) return;

    pathTitle.textContent = `مسیر یادگیری ${job}`;

    changeStage(0);

}


function changeStage(stageIndex) {

    currentStage = stageIndex;

    const data = jobData[currentJob];

    if (!data) return;

    const stage = data.learning[stageIndex];

stageTitle.textContent = stage.title;

stageDesc.textContent = stage.desc;

        

    stageItems.forEach((item, index) => {

        const circle =
            item.querySelector(".num-circle");

        const box =
            item.querySelector(".stage-box");

        circle.classList.remove("active");
        box.classList.remove("stage-active");

        if (index === stageIndex) {

            circle.classList.add("active");
            box.classList.add("stage-active");

        }

    });


// مرحله اول
if(stageIndex === 0){

    videoBox.classList.remove("hidden");
    skillsBox.classList.add("hidden");

    changeVideo(stageIndex);

}

// مرحله دوم


// مرحله سوم
if(stageIndex === 2){

    videoBox.classList.add("hidden");
    skillsBox.classList.add("hidden");

}

if(stageIndex === 1){

    videoBox.classList.add("hidden");
    skillsBox.classList.remove("hidden");
    changeSkill(0);

    document.getElementById("skillsTitle").textContent =
        data.skills.title;

    const skillsList =
        document.getElementById("skillsList");

    skillsList.replaceChildren();

    data.skills.skill.forEach(skill => {

        const item =
            document.createElement("div");

        item.className =
            "panel rounded-xl p-3 mb-3";

        item.textContent =
            skill;

        skillsList.append(item);

    });

}
}


function changeVideo(videoIndex) {
    const data = jobData[currentJob];

    if (!data) return;

    const video =
        data.videos[videoIndex];

    if (!video) return;

    videoTitle.textContent =
        video.title;

    if (videoFrame) {

        videoFrame.src =
            video.embed;

    }


    videoButtons.forEach(btn => {

        btn.classList.remove("active");

    });


    if (videoButtons[videoIndex]) {

        videoButtons[videoIndex].classList.add("active");


    }

}



videoButtons.forEach((btn, index) => {

    btn.addEventListener("click", () => {

        changeVideo(index);

    });

});

skillButtons.forEach((btn, index)=>{

    btn.addEventListener("click",()=>{

        changeSkill(index);

    });

});


stageItems.forEach((item, index) => {

    item.addEventListener("click", () => {

        changeStage(index);

    });

});




function changeSkill(skillIndex) {
console.log(currentJob);
console.log(jobData[currentJob]);
    const data = jobData[currentJob];

    if (!data) return;

    skillButtons.forEach(btn => {
        btn.classList.remove("active");
    });

    if (skillButtons[skillIndex]) {
        skillButtons[skillIndex].classList.add("active");
    }

    skillContent.replaceChildren();

    let items = [];

    switch(skillIndex){

        case 0:
            items = data.skills.skill;
            break;

        case 1:
            items = data.skills.tools;
            break;

        case 2:
            items = data.skills.carees;
            break;

        case 3:
            items = data.skills.learningtimes;
            break;

        case 4:
            items = data.skills.roadmap;
            break;

    }

    items.forEach(item => {

        const card = document.createElement("div");

        card.className = "panel rounded-xl p-3 mb-3";

        card.textContent = item;

        skillContent.append(card);

    });
    
}