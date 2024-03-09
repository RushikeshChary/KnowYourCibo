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

document.getElementById("edit-profile-form").onsubmit = async (e) => {
  e.preventDefault();
  const firstName = document.getElementById("firstName").value;
  const lastName = document.getElementById("lastName").value;
  const password = document.getElementById("password").value;
  const newpassword = document.getElementById("newpassword").value;
  try {
    const response = await fetch("/check-editProfile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName, lastName, password, newpassword }),
    });
    const data = await response.json();
    if (data.error) {
      alert(data.error);
    } else {
      alert(data.message);
      window.location.href = "/profile";
    }
  } catch (error) {
    console.error("Error setting password:", error);
    alert("Error in fetching changes from server");
  }
};
