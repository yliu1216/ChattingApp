/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,jsx}"],
  theme: {
    colors: {
      'red':'#f87171',
      'primary':'#F54B47',
      'white':'#ffff',
      'gray-300':"#c0c0c0",
      'gray-100':"#d8d8d8",
      'pink':'#FFD1DC',
      'light-pink': '#F2DBE7',
      'pink-2':'#E5CCC9',
      'black' : '#000000',
      'lime' :'#00A300',
      'blue-25':'#CFEBFD',
      'blue-50':'#AEDCFA',
      'blue':'#139EFA',
      'yellow':'#FFFF00',
      'teal':'#008080',

    },
    extend:{},
  },
  plugins: [
    require('tailwindcss'),
    require('autoprefixer'),
  ],
}

