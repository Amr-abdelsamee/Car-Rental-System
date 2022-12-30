document.getElementById("company").addEventListener("input", function (evt) {
if (this.value=="" || this.value.length < 2 || isNaN(this.value)==false){ 
    this.style.borderBottom = "3px solid red";
}
else{
    this.style.borderBottom = "3px solid green";
}
});
document.getElementById("model").addEventListener("input", function (evt) {
if (this.value=="" || this.value.length < 2 || isNaN(this.value)==false){
    this.style.borderBottom = "3px solid red";
}
else{
    this.style.borderBottom = "3px solid green";
}
});
document.getElementById("year").addEventListener("input", function (evt) {
if (this.value=="" || this.value < 1899 || this.value > 2025 || isNaN(this.value)){
    this.style.borderBottom = "3px solid red";
}
else{
    this.style.borderBottom = "3px solid green";
}
});

document.getElementById("miles").addEventListener("input", function (evt) { 
if (this.value=="" || this.value < 0 || isNaN(this.value)){
    this.style.borderBottom = "3px solid red";
}
else{
    this.style.borderBottom = "3px solid green";
}
});
document.getElementById("price").addEventListener("input", function (evt) {
if (this.value=="" || this.value < 0 || isNaN(this.value)){
    this.style.borderBottom = "3px solid red";
}
else{
    this.style.borderBottom = "3px solid green";
}
});
document.getElementById("lic_no").addEventListener("input", function (evt) {
    if (this.value==""){
    this.style.borderBottom = "3px solid red";
}
else{
    this.style.borderBottom = "3px solid green";
}
});
