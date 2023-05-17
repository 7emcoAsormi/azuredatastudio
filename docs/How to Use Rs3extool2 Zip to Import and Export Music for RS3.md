## How to Use Rs3extool2 Zip to Import and Export Music for RS3

 
![Rs3extool2 Zip](https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcRA69znm4EMCimqq-nrX9atGUMmYS954772j2VhjH-nIe4Dm2UyRurG1gc)

 
# How to Use Rs3extool2 Zip to Import and Export Music for RS3
 
If you are a fan of RS3, a game for SNES that features a rich and diverse soundtrack, you might be interested in using Rs3extool2 Zip, a tool that can import and export music formatted as Music Macro Language (MML) files. MML is a text-based format that allows you to create music by specifying notes, instruments, tempo, volume, and other parameters. With Rs3extool2 Zip, you can modify the existing music in RS3 or create your own custom tracks.
 
## Rs3extool2 Zip


[**Download**](https://www.google.com/url?q=https%3A%2F%2Fcinurl.com%2F2tKaOj&sa=D&sntz=1&usg=AOvVaw1fQkMU---OJtLQNdWhge_t)

 
In this article, we will show you how to use Rs3extool2 Zip to import and export music for RS3. You will need the following:
 
- A SNES emulator that can run RS3.
- A ROM file of RS3 (headered or unheadered).
- A copy of Rs3extool2 Zip, which you can download from [this link](https://pastebin.com/7JCaxgqE).
- Some MML files that you want to import or export. You can find some examples of MML files for RS3 on [this page](https://www.chronocompendium.com/Term/Using_the_RS3ExTool2_Tool.html).

Once you have everything ready, follow these steps:

1. Extract the Rs3extool2 Zip file to a folder of your choice.
2. Open the Rs3extool2.exe file. You will see a window like this:
3. ![Rs3extool2 window](rs3extool2.png)
4. Click on the "..." button next to the "ROM File" field and browse to the location of your RS3 ROM file. The tool will automatically detect if your ROM is headered or unheadered.
5. Click on the "..." button next to the "MML File" field and browse to the location of the MML file that you want to import or export.
6. If you want to import a MML file into RS3, select the song index and the offset where you want to insert the song. You can also check the boxes below to determine where in RS3 the song will play. For example, if you want to replace the title screen music with your custom track, check the box next to "Title".
7. If you want to export a MML file from RS3, select the song index that you want to export. The offset will be automatically filled in.
8. Click on the bottom right button (the one with an arrow pointing right) to import a MML file into RS3, or click on the bottom left button (the one with an arrow pointing left) to export a MML file from RS3.
9. The tool will show a message indicating if the operation was successful or not. If successful, you can save your modified ROM file by clicking on "File" and then "Save ROM".
10. You can now load your modified ROM file into your SNES emulator and enjoy your custom music.

We hope this article was helpful for you. If you have any questions or feedback, feel free to leave a comment below. Happy gaming!
  
## How to Write MML Commands for Rs3extool2 Zip
 
Now that you know how to use Rs3extool2 Zip to import and export music for RS3, you might be wondering how to write MML commands for your custom tracks. MML commands are the text-based instructions that tell the tool how to play the notes, instruments, tempo, volume, and other parameters of your music. You can write MML commands using any text editor, such as Notepad.
 
MML commands are divided into different channels, each representing a different voice or instrument. Each channel starts with a letter from A to P, followed by a colon. For example, A: is the first channel, B: is the second channel, and so on. You can have up to 16 channels in one MML file.
 
Within each channel, you can use various commands to specify the musical elements of your track. Some of the most common commands are:

- @<n> - Set instrument (Command DC). This command changes the instrument for the current channel. The <n> parameter is a hexadecimal value from 00 to FF that corresponds to a specific instrument. For example, @20 sets the instrument to piano, @21 sets it to harpsichord, and so on. You can find a list of instrument values for RS3 on <a href="https://www.chronocompendium.com/Term/Using_the_RS3ExTool2_Tool.html">this page</a>.</n></n>
- t<n> - Set tempo. This command changes the tempo for the whole MML file. The <n> parameter is a decimal value from 1 to 255 that represents the number of beats per minute (BPM). For example, t120 sets the tempo to 120 BPM.</n></n>
- v<n> - Set volume. This command changes the volume for the current channel. The <n> parameter is a decimal value from 0 to 127 that represents the loudness level. For example, v64 sets the volume to half of the maximum level.</n></n>
- p<n> - Set pan. This command changes the pan for the current channel. The <n> parameter is a decimal value from 0 to 127 that represents the position of the sound in the stereo field. For example, p0 sets the pan to left, p64 sets it to center, and p127 sets it to right.</n></n>
- o<n> - Set octave. This command changes the octave for the current channel. The <n> parameter is a decimal value from 0 to 8 that represents the octave number. For example, o4 sets the octave to 4.</n></n>
- cdefgab - Play notes. These commands play notes on the current channel. The letters represent the note names in the chromatic scale. You can add + or - after a note name to raise or lower it by a semitone (half-step). For example, c+ plays C sharp and d- plays D flat. You can also add a number after a note name to specify its duration in terms of ticks (1/48 of a quarter note). For example, c4 plays C for four ticks (1/12 of a quarter note) and d8 plays D for eight ticks (1/6 of a quarter note). If no number is specified, the default duration is one tick.
- r - Play rest. This command plays a rest (silence) on the current channel. You can add a number after r to specify its duration in terms of ticks. For example, r4 plays a rest for four ticks and r8 plays a rest for eight ticks. If no number is specified, the default duration is one tick.
- &lt; - Decrease octave. This command decreases the octave for the current channel by one.
- &gt; - Increase octave. This command increases the octave for the current channel by one.
- [...] - Repeat section. These commands enclose a section of MML commands that will be repeated a certain number of times. You can add a number after ] to specify how many times to repeat the section. For example, [cdefgab]2 repeats cdefgab twice.

Here is an example of an MML file that plays a simple melody on two channels:

    A:@20t120v64o 0f148eb4a0
