import * as inquirer from "inquirer"
import * as ytdl from "ytdl-core"
import * as util from "util"
import * as fs from "fs"

import { YtdlManager } from "../utils/ytdl-manager"

export async function download(videoUrl: string) {
    const manager = new YtdlManager(videoUrl);

    const info = await manager.getVideoInfo();
    const videoDetails = info.videoDetails;
    const formats = info.formats;

    const videoTitle = videoDetails.title;
    const videAuthor = videoDetails.author.name;
    const title = util.format("%s [%s]", videoTitle, videAuthor);

    console.log(title);

    const formatList:any = manager.getFormatList(formats, [
        'highest',
        'lowest',
        'highestvideo',
        'lowestvideo',
        'highestaudio',
        'lowestaudio',
    ]);
    const quality = await inquirer.prompt([
        {
            message: `Choose which quality you want to download?`,
            name: 'quality',
            type: 'list',
            choices: formatList
        }
    ]);

    const format = ytdl.chooseFormat(formats, { quality: quality.quality.split(' - ')[0] });
    
    console.log(util.format('%s downloading...', title));

    const videoFile = util.format('%s.%s', videoTitle, format.container);
    await manager.download(format, videoFile);

    console.log(util.format('%s file saved.', videoFile));

    if (!format.hasAudio) {
        const wantAudio = await inquirer.prompt([
            {
                message: `The selected format does not contain audio track. Want to select an audio track?`,
                name: 'wantAudio',
                type: 'list',
                choices: [
                    'Yes',
                    'No'
                ]
            }
        ]);

        if (wantAudio.wantAudio == 'Yes') {
            const formatList = manager.getFormatList(formats, [
                'highestaudio',
                'lowestaudio',
            ], 'audioonly');
        
            const quality = await inquirer.prompt([
                {
                    message: `Choose which quality you want to download?`,
                    name: 'quality',
                    type: 'list',
                    choices: formatList
                }
            ]);

            console.log(util.format('%s audio downloading...', title));

            const formatAudio = ytdl.chooseFormat(info.formats, { quality: quality.quality.split(' - ')[0] });
            const audioFile = util.format('%s_audio.%s', videoTitle, format.container);
            await manager.download(formatAudio, audioFile);

            console.log(util.format('%s audio file saved.', audioFile));
            console.log(util.format('Processing...'));

            const finalFile = util.format('%s_withaudio.mp4', videoTitle);
            await manager.merge(videoFile, audioFile, finalFile);
            
            console.log('Processing finished !');
            console.log(util.format('%s file saved.', finalFile));

            const wantDelete = await inquirer.prompt([
                {
                    message: `Want to delete downloaded video and audio files? (The processed file is not deleted.)`,
                    name: 'wantDelete',
                    type: 'list',
                    choices: [
                        'Yes',
                        'No'
                    ]
                }
            ]);

            if (wantDelete.wantDelete == 'Yes') {
                await fs.unlinkSync(videoFile)
                await fs.unlinkSync(audioFile)

                console.log('Junk files removed.');
            }
        }
    }
}