



document.getElementById("feedbackForm").onsubmit = async (e) => {
    e.preventDefault();
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const comments = document.getElementById("comments").value;
    const feedbackDate = document.getElementById("feedbackDate").value;
    const rating = 3;
    // const newpassword = document.getElementById("newpassword").value;
    try {
      const response = await fetch("/submit-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, feedbackDate,rating,comments}),
      });
      const data = await response.json();
      if (data.error) {
        alert(data.error);
        window.location.href = "/Feedback";
      } else {
        alert(data.message);
        window.location.href = "/Feedback";
      }
    } catch (error) {
      console.error("Error setting password:", error);
      alert("Error in fetching changes from server");
    }
  };