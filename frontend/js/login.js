

document.getElementById("loginBtn").addEventListener("click", async () => {
    try {
        const email = document.getElementById("email").value
        const password = document.getElementById("password").value

        const response = await fetch("http://127.0.0.1:5000/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                password
            })
        });



        const result = await response.json()

        if (!response.ok) {
            alert(result.message);
            return;
        }

        localStorage.setItem("userId", result.id)
        // توکن ورود برای بازی استعدادیابی (و ذخیره‌ی امن اطلاعات هر کاربر)
        if (result.token) localStorage.setItem("authToken", result.token)
        const next = new URLSearchParams(window.location.search).get("next")
        window.location.href = next && /^[\w.\-]+\.html(\?[\w=&%.\-]*)?$/.test(next) ? next : "index.html";
    }
    catch (err) {
        alert("خطا در ارتباط با سرور")
      
    }

    Form.reset();
})