import * as util from "util"
import * as fs from "fs"
import * as ytdl from "ytdl-core"
import * as ffmpeg from "fluent-ffmpeg"

export class YtdlManager {
    private videoUrl: string;

    constructor(videoUrl: string) {
        this.videoUrl = videoUrl
    }

    public async getVideoInfo() {
        return await ytdl.getInfo(this.videoUrl);
    }

    public getFormatList(formats: any[], additionalFormats: any[] = [], filter: ytdl.Filter|null = null) {
        if (filter) {
            formats = ytdl.filterFormats(formats, filter);
        }

        const formatList:any = additionalFormats;
        formats.forEach(format => {
            const itag = format.itag
            const mimetype = format.mimeType
            const container = format.container
            const quality = format.quality
            const qualityLabel = format.qualityLabel ? format.qualityLabel : 'Unknown'
    
            let contentInfo = null
            if (format.hasVideo) {
                contentInfo = 'Video'
            }
    
            if (format.hasAudio) {
                if (!contentInfo) {
                    contentInfo = 'Audio'
                } else {
                    contentInfo += '+Audio'
                }
            }
    
            const choice = util.format('%s - %s - %s - %s - %s - %s', itag, qualityLabel, quality, container, mimetype, contentInfo)
            formatList.push(choice)
        });

        return formatList;
    }

    public async download(format: ytdl.videoFormat, outputFile: string) {
        return await new Promise((resolve) => {
            ytdl.default(this.videoUrl, { format })
            .pipe(fs.createWriteStream(outputFile))
            .on('close', resolve)
        });
    }

    public async merge(videoFile: string, audioFile: string, outputFile: string) {
        return await new Promise((resolve) => {
            ffmpeg.default(videoFile)
            .input(audioFile)
            .videoCodec('copy')
            .audioCodec('aac')
            .output(outputFile)
            .on('end', resolve)
            .run();
        })
    }
}