

export default function Avatar({userId, username, online}){
    const colors=[
        'bg-red', 'bg-lime', 'bg-pink',
        'bg-blue', 'bg-yellow', 'bg-teal'
    ];

    const userIdBase10 = parseInt(userId, 16);
    const colorIndex = userIdBase10 % colors.length;
    const color = colors[colorIndex];



    return(
        <div className={"w-8 h-8 relative rounded-full text-center flex items-center " + color}>
            <div className="text-black text-center w-full opacity-70">{username[0]}</div>
            {online && (
                   <div className="absolute w-2 h-2 bg-lime bottom-0 right-0 rounded-full border border-white"></div>
            )
            }
            {
                !online && (
                    <div className="absolute w-2 h-2 bg-gray-300 bottom-0 right-0 rounded-full border border-white"></div>
                )
            }
        </div>
    );
}