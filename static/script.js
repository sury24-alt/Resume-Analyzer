let currentResumeText = "";
let analysisRawResult = "";

function login() {
    document.getElementById("login-screen").classList.remove("active");
    document.getElementById("app-screen").classList.add("active");
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    if (tabId === 'pdf') {
        document.querySelectorAll('.tab-btn')[0].classList.add('active');
        document.getElementById('pdf-tab').classList.add('active');
    } else {
        document.querySelectorAll('.tab-btn')[1].classList.add('active');
        document.getElementById('text-tab').classList.add('active');
    }
}

async function uploadPDF() {
    const fileInput = document.getElementById("pdf-upload");
    if (!fileInput.files.length) {
        alert("Please select a PDF file first.");
        return;
    }

    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append("file", file);

    const btn = document.querySelector("#pdf-tab .primary-btn");
    btn.innerHTML = "Processing...";
    btn.disabled = true;

    try {
        const response = await fetch("/api/extract_pdf", {
            method: "POST",
            body: formData
        });
        const data = await response.json();
        
        if (data.error) {
            alert(data.error);
        } else {
            currentResumeText = data.text;
            showSuccess();
        }
    } catch (e) {
        alert("Error uploading file.");
    } finally {
        btn.innerHTML = "Upload & Process PDF";
        btn.disabled = false;
    }
}

function saveText() {
    const text = document.getElementById("resume-text-input").value;
    if (!text.trim()) {
        alert("Please paste some text first.");
        return;
    }
    currentResumeText = text;
    showSuccess();
}

function showSuccess() {
    document.getElementById("upload-success").classList.remove("hidden");
    document.getElementById("actions-container").classList.remove("hidden");
}

async function analyzeResume() {
    const jobRole = document.getElementById("job-role").value;
    if (!jobRole.trim()) {
        alert("Please enter a target job role.");
        return;
    }

    const loader = document.getElementById("analysis-loader");
    const resultBox = document.getElementById("analysis-result");
    
    loader.classList.remove("hidden");
    resultBox.classList.add("hidden");
    
    try {
        const response = await fetch("/api/analyze", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                resume_text: currentResumeText,
                job_role: jobRole
            })
        });
        
        const data = await response.json();
        if (data.error) {
            alert(data.error);
        } else {
            analysisRawResult = data.result;
            resultBox.innerHTML = marked.parse(data.result);
            resultBox.classList.remove("hidden");
            document.getElementById("share-buttons").classList.remove("hidden");
        }
    } catch (e) {
        alert("Error analyzing resume.");
    } finally {
        loader.classList.add("hidden");
    }
}

async function suggestJobs() {
    const loader = document.getElementById("jobs-loader");
    const resultBox = document.getElementById("jobs-result");
    
    loader.classList.remove("hidden");
    resultBox.classList.add("hidden");
    
    try {
        const response = await fetch("/api/suggest_jobs", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                resume_text: currentResumeText
            })
        });
        
        const data = await response.json();
        if (data.error) {
            alert(data.error);
        } else {
            resultBox.innerHTML = marked.parse(data.result);
            resultBox.classList.remove("hidden");
        }
    } catch (e) {
        alert("Error suggesting jobs.");
    } finally {
        loader.classList.add("hidden");
    }
}

function getShareText() {
    // Truncate if too long for simple sharing, but generally fine for email
    const text = `Hey! I just analyzed my resume using AI and got this feedback:\n\n${analysisRawResult}`;
    // Return up to a reasonable length for URL sharing, or full for Clipboard
    return text;
}

function shareWhatsApp() {
    const text = encodeURIComponent(getShareText());
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
}

function shareEmail() {
    const subject = encodeURIComponent("My AI Resume Analysis Results");
    const body = encodeURIComponent(getShareText());
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
}

function shareInstagram() {
    // Instagram does not have a native web sharing URL for text.
    // Instead, we copy the text to clipboard and open Instagram.
    navigator.clipboard.writeText(getShareText()).then(() => {
        alert("Results copied to clipboard! You can now paste this into an Instagram Direct Message or Story.");
        window.open('https://www.instagram.com', '_blank');
    }).catch(err => {
        alert("Error copying to clipboard: " + err);
    });
}
