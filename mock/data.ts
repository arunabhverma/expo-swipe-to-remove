export type Notification = {
    id: string;
    icon: any;
    title: string;  
    subtitle?: string;
    time: string;
  };
  
  export const notifications: Notification[] = [
    {
      id: "1",
      icon: "https://randomuser.me/api/portraits/women/32.jpg",
      title: "Sarah Johnson",
      subtitle: "Hey! Are you coming to the party tonight? 🎉",
      time: "2m",
    },
    {
      id: "2",
      icon: "https://randomuser.me/api/portraits/men/45.jpg",
      title: "Mike Chen",
      subtitle: "Just sent you the project files. Let me know if you need anything else! 📁",
      time: "15m",
    },
    {
      id: "3",
      icon: "https://randomuser.me/api/portraits/women/68.jpg",
      title: "Emma Wilson",
      subtitle: "OMG! Did you see the new movie? It was amazing! 🎬",
      time: "1h",
    },
    {
      id: "4",
      icon: "https://randomuser.me/api/portraits/men/22.jpg",
      title: "David Park",
      subtitle: "Thanks for the help yesterday! You're a lifesaver 🙌",
      time: "2h",
    },
    {
      id: "5",
      icon: "https://randomuser.me/api/portraits/women/90.jpg",
      title: "Lisa Anderson",
      subtitle: "Can we reschedule our meeting to tomorrow? Something came up 🤔",
      time: "3h",
    },
    {
      id: "6",
      icon: "https://randomuser.me/api/portraits/men/33.jpg",
      title: "James Wilson",
      subtitle: "Just got the tickets! See you at the concert! 🎵",
      time: "5h",
    },
    {
      id: "7",
      icon: "https://randomuser.me/api/portraits/women/55.jpg",
      title: "Sophie Martinez",
      subtitle: "The photos from last weekend are ready! Check them out 📸",
      time: "8h",
    },
    {
      id: "8",
      icon: "https://randomuser.me/api/portraits/men/77.jpg",
      title: "Alex Thompson",
      subtitle: "Did you try that new restaurant I recommended? 🍽️",
      time: "12h",
    },
    {
      id: "9",
      icon: "https://randomuser.me/api/portraits/women/44.jpg",
      title: "Rachel Green",
      subtitle: "Happy Birthday! 🎂 Hope you have an amazing day!",
      time: "1d",
    },
  ];
  