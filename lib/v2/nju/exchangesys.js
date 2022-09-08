const got = require('@/utils/got');
const cheerio = require('cheerio');
const dayjs = require('dayjs');

module.exports = async (ctx) => {
    const type = ctx.params.type;
    const type_dict = {
        news: ['http://elite.nju.edu.cn/exchangesystem/index/moreList', 'http://elite.nju.edu.cn/exchangesystem/index/more?type=xw', '新闻通知'],
        proj: ['http://elite.nju.edu.cn/exchangesystem/index/moreXmList', 'http://elite.nju.edu.cn/exchangesystem/index/more?type=xm', '交换生项目'],
    };

    // First get the `me` parameter
    let meParam = null;
    try {
        const meResponse = await got({
            method: 'get',
            url: type_dict[type][1],
        });
        const me$ = cheerio.load(meResponse.data);
        meParam = me$('title').attr('data-m');
    } catch (e) {
        // pass
    }

    let url = type_dict[type][0] + '?page=1&limit=20';
    if (meParam) {
        url += `&.me=${meParam}`;
    }

    const response = await got({
        method: 'get',
        url,
        headers: {
            Referer: type_dict[type][1],
        },
    });

    const data = response.data;

    ctx.state.data = {
        title: `本科生交换生管理系统-${type_dict[type][2]}`,
        link: type_dict[type][1],
        item:
            data &&
            data.data &&
            data.data.map((item) => {
                if (type === 'proj') {
                    return {
                        title: item.mc,
                        description: item.mc,
                        pubDate: dayjs(item.cjsj),
                        link: item.sqyq,
                    };
                }
                if (type === 'news') {
                    return {
                        title: item.bt,
                        author: item.createBy,
                        description: item.nr,
                        pubDate: dayjs(item.createDate),
                        link: `http://elite.nju.edu.cn/exchangesystem/index/detail?pid=${item.pid}`,
                    };
                }
                return null;
            }),
    };
};
