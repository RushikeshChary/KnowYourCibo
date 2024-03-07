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
