import 'react-big-calendar/lib/css/react-big-calendar.css'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import Navbar from './Navbar';



const localizer = momentLocalizer(moment)

export default function calendar() {
return (
<div style={{height:'500px'}}>
<Calendar
localizer={localizer}
startAccessor="start"
endAccessor="end"
style={{ margin: '50' }}
/>
<Navbar/>
</div>
)
}