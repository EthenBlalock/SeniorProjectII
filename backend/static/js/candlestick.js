{
    class CandlestickFrame
    {
        constructor(timestamp, open, high, low, close)
        {
            this.timestamp = timestamp;
            this.open = open;
            this.high = high;
            this.low = low;
            this.close = close;
            this.root = null;
            this.bar = null;
            this.wick = null;
            this.selected = false;
        }

        draw(index, root, frame_width, frame_height, max_amount)
        {
            let frame_cont = document.createElement('div');
            let frame_bar = document.createElement('div');
            let frame_line = document.createElement('div');
            let frame_min = Math.min(this.high, this.low, this.open, this.close);
            let frame_max = Math.max(this.high, this.low, this.open, this.close);
            let total = frame_max - frame_min;

            if (this.open === this.close) frame_cont.className = 'candlestick candlestick-neutral';
            else if (this.open < this.close) frame_cont.className = 'candlestick candlestick-positive';
            else frame_cont.className = 'candlestick candlestick-negative';

            frame_bar.className = 'candlestick-inner';
            frame_bar.style.height = `${(Math.abs(this.open - this.close) / total) * 100}%`;
            frame_bar.style.top = `${(this.high - Math.max(this.open, this.close)) / total * 100}%`;

            frame_line.className = 'candlestick-wick'

            frame_cont.style.height = `${frame_height * total}%`;
            frame_cont.style.width = `${frame_width * 0.75}%`;
            frame_cont.style.top = `${frame_height * (max_amount - frame_max)}%`;
            frame_cont.style.left = `${frame_width * index}%`;
            frame_cont.style.width = `${frame_width}%`;

            frame_cont.appendChild(frame_bar);
            frame_cont.appendChild(frame_line);
            root.appendChild(frame_cont);
            this.root = frame_cont;
            this.bar = frame_bar;
            this.wick = frame_line;
        }

        setSelected(selected)
        {
            if (this.selected === selected || this.bar === null || this.wick === null) return;
            this.selected = selected;
            this.bar.style.border = (selected) ? '0.0625em solid #eeeeee' : 'none';
            this.wick.style.backgroundColor = (selected) ? '#eeeeee' : '';
        }
    }

    class Candlestick
    {
        constructor(root, frames)
        {
            this.root = root;
            this.canvas = null;
            this.drag_start = null;
            this.frames = [];
            this.hover = null;
            this.update_mouse = this.update_mouse.bind(this);
            this.drag_select = this.drag_select.bind(this);
            this.get_candlesticks_within_box = this.get_candlesticks_within_box.bind(this);
            for (let frame of frames.toSorted((frame) => frame.timestamp)) this.frames.push(new CandlestickFrame(frame.TimeStamp, frame.OpenPrice, frame.MomentHigh, frame.MomentLow, frame.ClosePrice));
        }

        draw()
        {
            let root = document.createElement('div');
            root.className = 'candlestick-root';

            let clip = document.createElement('div');
            clip.className = 'candlestick-clip';

            this.canvas = document.createElement('canvas');
            clip.appendChild(this.canvas);

            this.hover = document.createElement('div');
            this.hover.className = 'legend';
            let inner = document.createElement('div');
            inner.appendChild(document.createElement('p'));
            inner.appendChild(document.createElement('p'));
            inner.appendChild(document.createElement('p'));
            inner.appendChild(document.createElement('p'));
            inner.appendChild(document.createElement('p'));
            this.hover.appendChild(inner);

            clip.appendChild(this.hover);

            if (this.frames.length > 0)
            {
                let table = document.createElement('div');
                table.className = 'candlestick-table';

                let min_timestamp = this.frames[0].timestamp;
                let max_timestamp = this.frames[this.frames.length - 1].timestamp;
                let min_amount = Math.min(...this.frames.map((frame) => Math.min(frame.open, frame.close, frame.low, frame.high)));
                let max_amount = Math.max(...this.frames.map((frame) => Math.max(frame.open, frame.close, frame.low, frame.high)));
                let frame_width = 100 / this.frames.length;
                let frame_height = 100 / (max_amount - min_amount);

                for (let index in this.frames)
                {
                    let frame = this.frames[index];
                    frame.draw(index, table, frame_width, frame_height, max_amount);
                }

                clip.appendChild(table);
            }

            root.appendChild(clip);
            this.root.appendChild(root);
            root.addEventListener('mouseleave', (e) => this.update_mouse(null));
            root.addEventListener('mousemove', this.update_mouse);
            root.addEventListener('mousedown', (e) => this.drag_start = [e.x, e.y]);
            root.addEventListener('mouseup', this.drag_select);
        }

        update_mouse(event)
        {
            if (this.canvas === null) return;
            let ctx = this.canvas.getContext('2d');
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            let table = document.getElementsByClassName('candlestick-table')[0] ?? null;
            if (event === null || table === null) return;
            let size = Math.min(table.clientHeight, table.clientWidth);
            this.canvas.width = size;
            this.canvas.height = size;
            let rel = size / 100;
            let bounds = this.canvas.getBoundingClientRect();

            // Update legend
            if (this.hover !== null && this.drag_start === null)
            {
                let selected = this.get_candlestick_at_point(event.x, event.y);
                if (selected === null) this.hover.style.display = 'none';
                else
                {
                    this.hover.style.display = 'flex';
                    this.hover.style.top = `${event.y - bounds.y + size / 128}px`;

                    if (event.x - bounds.x > bounds.width * 0.75)
                    {
                        this.hover.style.right = `${bounds.width - (event.x - bounds.x) + size / 128}px`;
                        this.hover.style.left = 'unset';
                    }
                    else
                    {
                        this.hover.style.left = `${event.x - bounds.x + size / 128}px`;
                        this.hover.style.right = 'unset';
                    }

                    let text = this.hover.getElementsByTagName('p');
                    let date = new Date(selected.timestamp * 1000);
                    let options = {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: 'numeric',
                        second: 'numeric',
                        timeZoneName: 'short',
                        hour12: false,
                    };

                    text[0].innerText = `Date: ${new Intl.DateTimeFormat("en-US", options).format(date)}`;
                    text[1].innerText = `Open Price: ${price_converter.format(selected.open)}`;
                    text[2].innerText = `High Price: ${price_converter.format(selected.high)}`;
                    text[3].innerText = `Low Price: ${price_converter.format(selected.low)}`;
                    text[4].innerText = `Close Price: ${price_converter.format(selected.close)}`;
                }
            }

            ctx.setLineDash([rel / 4, rel / 2]);
            ctx.lineWidth = `${rel / 8}`;
            ctx.strokeStyle = '#aaaaaa';

            // Horizontal Line
            ctx.beginPath();
            ctx.moveTo(event.x - bounds.x, event.y - bounds.y);
            ctx.lineTo(this.canvas.width, event.y - bounds.y);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(event.x - bounds.x, event.y - bounds.y);
            ctx.lineTo(0, event.y - bounds.y);
            ctx.stroke();

            // Vertical Line
            ctx.beginPath();
            ctx.moveTo(event.x - bounds.x, event.y - bounds.y);
            ctx.lineTo(event.x - bounds.x, this.canvas.height);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(event.x - bounds.x, event.y - bounds.y);
            ctx.lineTo(event.x - bounds.x, 0);
            ctx.stroke();

            // Drag Selection
            if (this.drag_start === null) return;
            ctx.fillStyle = 'rgba(92, 92, 255, 0.25)';
            ctx.fillRect(this.drag_start[0] - bounds.x, this.drag_start[1] - bounds.y, event.x - this.drag_start[0], event.y - this.drag_start[1]);
        }

        drag_select(event)
        {
            if (this.canvas === null) return;
            for (let frame of this.frames) frame.setSelected(false);
            for (let frame of this.get_candlesticks_within_box(new DOMRect(this.drag_start[0], this.drag_start[1], event.x - this.drag_start[0], event.y - this.drag_start[1]))) frame.setSelected(true);
            this.drag_start = null;
        }

        *get_candlesticks_within_box(rect)
        {
            for (let frame of this.frames)
            {
                if (frame.root === null) continue;
                let bounds = frame.root.getBoundingClientRect();
                if (!(bounds.right <= rect.left
                    || bounds.left >= rect.right
                    || bounds.bottom <= rect.top
                    || bounds.top >= rect.bottom
                )) yield frame;
            }
        }

        get_candlestick_at_point(x, y)
        {
            for (let frame of this.frames)
            {
                if (frame.root === null) continue;
                let bounds = frame.root.getBoundingClientRect();
                if (x >= bounds.x && x < bounds.x + bounds.width && y >= bounds.y && y < bounds.y + bounds.height) return frame;
            }

            return null;
        }
    }

    let auth = null;
    let price_converter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    })

    window.addEventListener('load', async (e) => {
        let query = new URLSearchParams(window.location.search);
        let company_code = query.get('company');
        if (company_code === null) return;
        let period = query.get('period') ?? 'PAST_YEAR';
        let interval = query.get('interval') ?? 'DAY';
        let response = await window.fetch('/react/connect', {headers: {'Content-Type': 'application/json'}, method: 'POST', body: '{}'});
        let root = document.getElementById('root');

        if (!response.ok)
        {
            root.innerText = `Failed to authenticate API: ${response.status} -> ${response.statusText}`;
            return;
        }

        auth = (await response.json()).auth;
        let frames = await (await window.fetch('/react/company-history', {headers: {'Content-Type': 'application/json'}, method: 'POST', body: JSON.stringify({
                'auth': auth,
                'company': company_code,
                'period': period,
                'interval': interval
        })})).json();
        let candlestick = new Candlestick(root, frames);
        candlestick.draw();
    });

    window.addEventListener('beforeunload', async (e) => {
        if (auth === null) return;
        await window.fetch('/react/disconnect', {headers: {'Content-Type': 'application/json'}, method: 'POST', body: JSON.stringify({'auth': auth})});
        auth = null;
    });
}