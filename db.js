
const getData = async()=>{
    const response = await fetch('/database');
    try{
        const data = await response.json();
        console.log(data);
        stringifiedData = JSON.stringify(data);
        console.log(stringifiedData);
        data[0].car = "BMW";
        console.log(data);
        return data;
    }catch(error){
        console.log("error", error);
    }
}
const returnal=getData();
document.getElementById('allresults').innerHTML = returnal;
