var cursor = document.getElementById("cursor");
document.addEventListener("mousemove", function (e) {
  var x = e.clientX;
  var y = e.clientY;
  cursor.style.left = x + "px";
  cursor.style.top = y + "px";
});

const str = "KNOW YOUR CIBO. EAT RATE CURATE.";
const text = document.getElementById("text1");
window.onload = function () {
  for (let i = 0; i < str.length; i++) {
    let span = document.createElement("span");
    span.innerHTML = str[i];
    text.appendChild(span);
    console.log(str[i]);
    span.style.transform = `rotate(${11 * i}deg)`;
  }
};

document.getElementById("verifyEmail").addEventListener("click", async () => {
  const email = document.getElementById("email").value;
  if (!email) {
    alert("Please enter an email.");
    return;
  }
  try {
    // Check if the user exists
    const checkUserResponse = await fetch("/check-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const checkUserData = await checkUserResponse.json();
    if (checkUserData.exists) {
      alert(checkUserData.message);
      return; // Stop further execution if the user exists
    }

    // If user doesn't exist, proceed to send OTP
    const otpResponse = await fetch("/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const otpData = await otpResponse.json();
    alert(otpData.message);
    if (!otpData.error) {
      document.getElementById("otpSection").style.display = "block";
    }
  } catch (error) {
    console.error("Error:", error);
    alert("An error occurred, please try again.");
  }
});

document.getElementById("verifyOtpLink").addEventListener("click", async () => {
  const email = document.getElementById("email").value;
  const otp = document.getElementById("otp").value;
  if (otp.length === 6) {
    try {
      const response = await fetch("/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await response.json();
      if (data.success) {
        alert("OTP verified successfully. Please set your password.");
        document.getElementById("passwordSection").style.display = "block";
        document.getElementById("submitSection").style.display = "flex";
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      alert("Error verifying OTP, please try again.");
    }
  } else {
    alert("Please enter a 6-digit OTP.");
  }
});
