var cursor = document.getElementById("cursor");
document.addEventListener("mousemove", function (e) {
  var x = e.clientX;
  var y = e.clientY;
  cursor.style.left = x + "px";
  cursor.style.top = y + "px";
});


document.getElementById('section1').style.display = "block";

function showSection(sectionId) {
    // Hide all sections
    var sections = document.getElementsByClassName("section");
    for (var i = 0; i < sections.length; i++) {
        sections[i].style.display = "none";
    }

    // Show the selected section
    var section = document.getElementById(sectionId);
    section.style.display = "block";
}

// Select all elements with the "i" tag and store them in a NodeList called "stars"
const stars = document.querySelectorAll(".stars i");

// Loop through the "stars" NodeList
stars.forEach((star, index1) => {
 // Add an event listener that runs a function when the "click" event is triggered
 star.addEventListener("click", () => {
   // Loop through the "stars" NodeList Again
   stars.forEach((star, index2) => {
     // Add the "active" class to the clicked star and any stars with a lower index
     // and remove the "active" class from any stars with a higher index
     index1 >= index2 ? star.classList.add("active") : star.classList.remove("active");
   });
 });
});
