import {trace, spy, observe, observable, action, computed, toJS} from 'mobx';
import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import {observer, PropTypes as ObservablePropTypes} from 'mobx-react'

// spy 可观察
// spy(e=>{
//     console.log(e);
// })

class Todo{
    id = Math.random();
    @observable title = '';
    @observable finished = false;

    constructor(title){
        this.title = title;
    }

    @action.bound toggle(){
        this.finished = !this.finished;
    }
}

class Store{
    @observable todos = [];

    disposers = [];

    constructor(){
        observe(this.todos,change => {
            this.disposers.forEach(disposer=>disposer());
            this.disposers = [];
            for(let todo of change.object){
                var disposer = observe(todo,changex=>{
                    this.save();
                })
                this.disposers.push(disposer);
            }
            this.save();
        })
    }

    save(){
        localStorage.setItem('todos',JSON.stringify(toJS(this.todos)));
    }

    @action.bound creatTodo(title){
        this.todos.unshift(new Todo(title));
    }

    @action.bound removeTodo(todo){
        this.todos.remove(todo);   //mobx提供的方法
    }

    @computed get left() {
        return this.todos.filter(todo => !todo.finished).length;
    }
}

const store = new Store();

@observer
class TodoItem extends Component {
    static propTypes={
        todo:PropTypes.shape({
            id:PropTypes.number.isRequired,
            title:PropTypes.string.isRequired,
            finished:PropTypes.bool.isRequired
        }).isRequired
    }
    handleClick = ()=>{
        this.props.todo.toggle();
    }
    render() {
        trace();
        const todo = this.props.todo;
        return <div>
            <input type="checkbox" className="toggle" checked={todo.finished} onClick={this.handleClick}/>
            <span className={["title",todo.finished && "finished"].join(' ')}>{todo.title}</span>
        </div>
    }
}

@observer
class TodoFooter extends Component {
    render() {
        trace();
        return  <footer>{this.props.store.left} items unfinished</footer>
    }
}

@observer
class TodoView extends Component {
    render(){
        trace();
        const todos = this.props.todos;
        return todos.map(todo=>{
            return <li className='todo-item' key={todo.id}>
                <TodoItem todo={todo}/>
                <span className="delete" onClick={()=>store.removeTodo(todo)}>X</span>
            </li>
        })
    }
}

@observer
class TodoHeader extends Component{

    state = {inputVal:''};

    handleSubmit = (e)=>{
        e.preventDefault();
        var store = this.props.store;
        var inputVal = this.state.inputVal;

        store.creatTodo(inputVal);

        this.setState({
            inputVal:''
        })
    }

    handleChange = (e)=>{
        var inputVal = e.target.value;
        this.setState({
            inputVal:inputVal
        })
    }
    render(){
        return <header>
        <form onSubmit={this.handleSubmit}>
            <input type="text" onChange={this.handleChange} value={this.state.inputVal} className='input' placeholder='what needs to be finshed'/>
        </form>
    </header>
    }
}

@observer
class TodoLists extends Component{
    static propTypes = {
        store: PropTypes.shape({
            creatTodo: PropTypes.func,
            todos:ObservablePropTypes.arrayOrObservableArrayOf(ObservablePropTypes.objectOrObservableObject).isRequired
        }).isRequired
    };

    render() {
        trace();  // debug的时候
        const store = this.props.store;
        const todos = store.todos;

        return <div className="todo-list">
            <TodoHeader store={store}/>
            <ul><TodoView todos={todos}/></ul>
            <TodoFooter store={store}/>
        </div>
    }
}

ReactDOM.render(<TodoLists store={store}/>, document.querySelector('#root'));