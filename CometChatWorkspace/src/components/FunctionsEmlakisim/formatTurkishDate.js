export default function formatTurkishDate(input) {
    // Girişin tarih mi saat mi olduğunu kontrol eder
    if (input.includes("/")) {
      // Tarih dönüşümü
      const date = new Date(input);
  
      const monthNames = [
        "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
        "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
      ];
  
      const day = date.getDate();
      const monthIndex = date.getMonth();
      const year = date.getFullYear();
  
      return day + ' ' + monthNames[monthIndex] + ' ' + year;
    } else {
      // Saat dönüşümü
      const timeParts = input.split(" ")[0].split(":");
      let hours = parseInt(timeParts[0]);
      const minutes = timeParts[1];
      const period = input.split(" ")[1];
  
      if (period === "PM" && hours < 12) {
        hours += 12;
      } else if (period === "AM" && hours === 12) {
        hours = 0;
      }
  
      hours = hours < 10 ? '0' + hours : hours;
  
      return hours + ':' + minutes;
    }
  }
  
//   console.log(formatTurkishDateOrTime("05/12/23")); // "12 Mayıs 2023" çıktısını verir
//   console.log(formatTurkishDateOrTime("2:29 AM")); // "02:29" çıktısını verir
//   console.log(formatTurkishDateOrTime("2:29 PM")); // "14:29" çıktısını verir
  