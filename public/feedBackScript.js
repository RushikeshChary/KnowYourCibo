// document.getElementById("feedbackForm").onsubmit = async (e) => {
//   e.preventDefault();
//   const name = document.getElementById("name").value;
//   const email = document.getElementById("email").value;
//   const comments = document.getElementById("comments").value;
//   const feedbackDate = document.getElementById("feedbackDate").value;
//   const ratingOptions = document.getElementsByName("rating");

//   let rating;
//   for (let i = 0; i < ratingOptions.length; i++) {
//       if (ratingOptions[i].checked) {
//           rating = ratingOptions[i].value;
//           break;
//       }
//   }

//   // if (!rating) {
//   //     alert("Please select a rating.");
//   //     return;
//   // }

//   try {
//       const response = await fetch("/submit-feedback", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ name, email, feedbackDate, rating, comments }),
//       });
//       const statusCode = response.statusCode;
//       const data = await response.json();
//       if (data.error) {
//           alert(data.error);
//           window.location.href = "/Feedback";
//       } else {
//           if(statusCode === 400) {
//             alert(data.message);
//             window.location.href = "/Feedback";
//           }
//       }
//   } catch (error) {
//       console.error("Error sending feedback mail", error);
//       alert("Error in fetching changes from server");
//   }
// };
