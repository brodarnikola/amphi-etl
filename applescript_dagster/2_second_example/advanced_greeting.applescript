-- advanced_greeting.applescript
on run argv
    set userName to item 1 of argv
    set userAge to item 2 of argv as number
    
    if userAge < 18 then
        display dialog "Hello " & userName & "! You're a minor." buttons {"OK"} default button "OK"
        return "minor"
    else if userAge < 65 then
        display dialog "Greetings " & userName & "! You're an adult." buttons {"OK"} default button "OK"
        return "adult"
    else
        display dialog "Welcome " & userName & "! You're a senior." buttons {"OK"} default button "OK"
        return "senior"
    end if
end run